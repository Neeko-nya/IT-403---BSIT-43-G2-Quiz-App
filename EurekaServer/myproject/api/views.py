import logging
from ninja import NinjaAPI
from pydantic import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount
from django.http import JsonResponse
import json
from .schemas import (
    UserOut,
    LoginSchema,
    SignupSchema,
    CreateClassSchema,
    ClassOut,
    JoinClassSchema,
    QuizOut,
    QuestionOut,
    ProfileUpdateSchema,
    PasswordUpdateSchema,
    JoinedClassSchema,
    AddStudentSchema,
    RemoveStudentSchema,
    CreateQuizSchema,
    UpdateQuizSchema,
    SubmitQuizSchema,
    QuestionSchema,
    AddQuestionToQuizSchema,
    QuizQuestionOut,
    SubmitQuizResponse,
    SubmitQuizRequest,
    InviteStudentSchema,
)
from .models import Class, Quiz, Question, QuizQuestion,ClassMembership, Response, Grade
from allauth.socialaccount.providers.google.provider import GoogleProvider
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.models import SocialLogin
from allauth.socialaccount.helpers import complete_social_login
from django.conf import settings
from .auth import authenticate_google_user
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from typing import List, Optional
from django.shortcuts import get_list_or_404, get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
api = NinjaAPI()
User = get_user_model()
logger = logging.getLogger(__name__)

# JWT Authentication Endpoint
@api.post("auth/login/", response=UserOut)
def login(request, data: LoginSchema):
    user = None
    # Check if the login data contains an email
    if "@" in data.email:  # If input contains '@', it's an email
        user = User.objects.filter(email=data.email).first()
    else:  # Otherwise, treat it as a username
        user = User.objects.filter(username=data.email).first()

    # If user is found, authenticate the password
    if user and user.check_password(data.password):
        # Get role directly from the User model
        role = user.role

        # Create JWT token
        refresh = RefreshToken.for_user(user)

        # Return user, access_token, and role
        return {
            "username": user.username,
            "email": user.email,
            "access_token": str(refresh.access_token),
            "role": role,
        }

    # If credentials are invalid, return error
    return JsonResponse({"detail": "Invalid credentials"}, status=401)


# Signup Endpoint
@api.post("auth/signup/", response=UserOut)
def signup(request, data: SignupSchema):
    # Check if username already exists
    if User.objects.filter(username=data.username).exists():
        return JsonResponse({"detail": "Username already exists."}, status=400)

    # Check if email already exists
    if User.objects.filter(email=data.email).exists():
        return JsonResponse({"detail": "Email already exists."}, status=400)

    # Create the user
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password,
        role=data.role,  # Set role directly in the User model
    )

    # Create JWT token
    refresh = RefreshToken.for_user(user)

    # Return user, access_token, and role
    return {
        "username": user.username,
        "email": user.email,
        "access_token": str(refresh.access_token),
        "role": user.role,
    }


# Google OAuth Endpoint using custom authentication function
@api.post("auth/google/", response=UserOut)
def google_login(request):
    try:
        # Retrieve token from the request body
        data = json.loads(request.body)
        print("Received data:", data)

        token = data.get("token")
        if not token:
            return JsonResponse({"detail": "Token is missing"}, status=400)

        # Use the custom authenticate_google_user function to verify the token and get or create the user
        user = authenticate_google_user(token)

        if not user:
            return JsonResponse({"detail": "Google authentication failed"}, status=400)

        # Ensure the user has a role (default to 'student' if not set)
        if not hasattr(user, "role") or not user.role:
            user.role = "student"
            user.save()

        # Generate JWT token
        refresh = RefreshToken.for_user(user)

        # Return user info, role, and access token
        return JsonResponse(
            {
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "access_token": str(refresh.access_token),
            }
        )

    except Exception as e:
        print("Error during Google login:", e)
        return JsonResponse({"detail": "Google login failed"}, status=500)


@api.post("/create-class/")
def create_class(request, data: CreateClassSchema):
    # Authenticate the user using JWT
    try:
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        if not user:
            print("Authentication failed: No user found.")
            raise AuthenticationFailed("Authentication required.")
    except AuthenticationFailed:
        print("Authentication failed.")
        return JsonResponse({"detail": "Authentication required."}, status=401)

    try:
        # The teacher is the authenticated user
        teacher = user

        # Create the class
        class_instance = Class.objects.create(
            class_name=data.class_name,
            password=data.password,
            max_students=data.max_students,
            teacher=teacher,  # Dynamically assigned teacher
        )

        return JsonResponse(
            {"class_id": class_instance.id, "class_name": class_instance.class_name}
        )

    except Exception as e:
        print("Error creating class:", e)
        return JsonResponse({"detail": str(e)}, status=500)


# Get All Classes Endpoint
@api.get("/classes/", response=list[ClassOut])
def get_classes(request):
    classes = Class.objects.all()

    # Return the class details, including max_students and enrolled_students
    return [
        ClassOut(
            id=cls.id,
            class_name=cls.class_name,
            teacher_name=cls.teacher.username,
            max_students=cls.max_students,
            password=cls.password,
            enrolled_students=cls.enrolled_student_usernames(),  # Get the list of enrolled student usernames
        )
        for cls in classes
    ]


# Get Specific Class Details Endpoint
@api.get("/classes/{class_id}/", response=ClassOut)
def get_class_details(request, class_id: int):
    try:
        cls = Class.objects.get(id=class_id)

        # Return the class details, including max_students and enrolled students
        return ClassOut(
            id=cls.id,
            class_name=cls.class_name,
            teacher_name=cls.teacher.username,
            max_students=cls.max_students,
            password=cls.password,
            enrolled_students=cls.enrolled_student_usernames(),  # List of enrolled students
        )
    except Class.DoesNotExist:
        return JsonResponse({"detail": "Class not found."}, status=404)


@api.put("/classes/{class_id}/", response=ClassOut)
def update_class_details(request, class_id: int, data: CreateClassSchema):
    try:
        # Authenticate the user using JWT
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        if not user:
            raise AuthenticationFailed("Authentication required.")

        # Fetch the class instance
        class_instance = Class.objects.filter(id=class_id).first()

        if not class_instance:
            return JsonResponse({"detail": "Class not found."}, status=404)

        # Ensure only the teacher can edit the class
        if class_instance.teacher != user:
            return JsonResponse(
                {"detail": "You are not authorized to update this class."}, status=403
            )

        # Update the class instance fields
        for field, value in data.dict(exclude_unset=True).items():
            setattr(class_instance, field, value)

        # Save the updates
        class_instance.save()

        # Return the updated class details
        return ClassOut(
            id=class_instance.id,
            class_name=class_instance.class_name,
            teacher_name=class_instance.teacher.username,
            max_students=class_instance.max_students,
            password=class_instance.password,
            enrolled_students=class_instance.enrolled_student_usernames(),
        )

    except AuthenticationFailed as e:
        return JsonResponse({"detail": str(e)}, status=401)
    except Exception as e:
        return JsonResponse({"detail": f"Failed to update class: {str(e)}"}, status=500)


# @api.post("/classes/{class_id}/add-student/")
# def add_student(request, class_id: int, data: AddStudentSchema):
#     try:
#         # Get the class instance
#         class_instance = Class.objects.filter(id=class_id).first()
#         if not class_instance:
#             return JsonResponse({"detail": "Class not found."}, status=404)

#         # Get the student from the database
#         student = User.objects.filter(username=data.username).first()
#         if not student:
#             return JsonResponse({"detail": "Student not found."}, status=404)

#         # Add the student to the class
#         class_instance.students.add(student)
#         return JsonResponse({"detail": f"{data.username} added successfully."})

#     except ValidationError as ve:
#         return JsonResponse(
#             {"detail": "Validation error", "errors": ve.errors()}, status=400
#         )
#     except Exception as e:
#         return JsonResponse({"detail": f"Error: {str(e)}"}, status=500)

@api.post("/classes/{class_id}/join/")
def join_class_by_id(request, class_id: int, data: InviteStudentSchema):
    try:
        # Fetch the class instance
        class_instance = Class.objects.filter(id=class_id).first()
        if not class_instance:
            return JsonResponse({"detail": "Class not found."}, status=404)

        # Fetch the user by username
        user = User.objects.filter(username=data.username).first()
        if not user:
            return JsonResponse({"detail": "User not found."}, status=404)

        # Check if the class is full
        if class_instance.students.count() >= class_instance.max_students:
            return JsonResponse({"detail": "Class is full."}, status=400)

        # Check if the user is already a member of the class
        if class_instance.students.filter(id=user.id).exists():
            return JsonResponse({"detail": "User is already enrolled in this class."}, status=400)

        # Add the user to the class (Many-to-Many relation)
        class_instance.students.add(user)

        # Create a ClassMembership record if it doesn't already exist
        ClassMembership.objects.get_or_create(class_id=class_instance, student_id=user)

        return JsonResponse({"detail": f"{data.username} successfully joined the class."}, status=200)

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

# @api.post("/classes/{class_id}/remove-student/")
# def remove_student_from_class(request, class_id: int, data: RemoveStudentSchema):
#     try:
#         # Fetch the class instance
#         class_instance = Class.objects.filter(id=class_id).first()
#         if not class_instance:
#             return JsonResponse({"detail": "Class not found."}, status=404)

#         # Find the student to remove
#         student = User.objects.filter(username=data.username).first()
#         if not student:
#             return JsonResponse({"detail": "Student not found."}, status=404)

#         # Remove the student from the class
#         class_instance.students.remove(student)
#         return JsonResponse(
#             {"detail": f"Student '{data.username}' removed successfully."}
#         )

#     except Exception as e:
#         return JsonResponse(
#             {"detail": f"Failed to remove student: {str(e)}"}, status=500
#         )


@api.post("/classes/{class_id}/remove-student/")
def remove_student(request, class_id: int, data: RemoveStudentSchema):
    try:
        # Fetch the class instance
        class_instance = Class.objects.filter(id=class_id).first()
        if not class_instance:
            return JsonResponse({"detail": "Class not found."}, status=404)

        # Fetch the user by username
        user = User.objects.filter(username=data.username).first()
        if not user:
            return JsonResponse({"detail": "User not found."}, status=404)

        # Check if the user is enrolled in the class
        if not class_instance.students.filter(id=user.id).exists():
            return JsonResponse({"detail": "User is not enrolled in this class."}, status=400)

        # Remove the user from the class (Many-to-Many relation)
        class_instance.students.remove(user)

        # Remove the corresponding ClassMembership record
        ClassMembership.objects.filter(class_id=class_instance, student_id=user).delete()

        return JsonResponse({"detail": f"{data.username} successfully removed from the class."}, status=200)

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)


@api.get("/quizzes/", response=list[QuizOut])
def get_quizzes(request):
    try:
        quizzes = Quiz.objects.select_related(
            "class_id"
        ).all()  # Use select_related for optimization
        quizzes_data = [
            QuizOut(
                id=quiz.id,
                quiz_name=quiz.quiz_name,
                class_name=quiz.class_id.class_name,  # Ensure class_name exists in the related model
                schedule_start=quiz.schedule_start,
                schedule_end=quiz.schedule_end,
                duration_minutes=quiz.duration_minutes,
                created_at=quiz.created_at,
            )
            for quiz in quizzes
        ]
        return quizzes_data  # Return data directly; Ninja will handle serialization

    except Exception as e:
        return {
            "detail": f"Error: {str(e)}"
        }  # Use a plain dictionary for error handling


@api.post("/quizzes/", response=QuizOut)
def create_quiz(request, data: CreateQuizSchema):
    try:
        # Validate if class_id exists
        class_obj = Class.objects.filter(id=data.class_id).first()
        if not class_obj:
            return {"detail": "Class not found."}, 404

        # Save the quiz to the database
        new_quiz = Quiz.objects.create(
            quiz_name=data.quiz_name,
            class_id=class_obj,
            schedule_start=data.schedule_start,
            schedule_end=data.schedule_end,
            duration_minutes=data.duration_minutes,
        )

        # Prepare response
        quiz_response = QuizOut(
            id=new_quiz.id,
            quiz_name=new_quiz.quiz_name,
            class_name=class_obj.class_name,  # Access the related class_name
            schedule_start=new_quiz.schedule_start,
            schedule_end=new_quiz.schedule_end,
            duration_minutes=new_quiz.duration_minutes,
            created_at=new_quiz.created_at,
        )

        return quiz_response  # Ninja handles serialization

    except Exception as e:
        return {"detail": f"Error: {str(e)}"}, 500


@api.get("/classes/", response=list[ClassOut])
def get_all_classes(request):
    classes = Class.objects.all()
    class_list = [
        {
            "id": cls.id,  # Ensure id is included
            "name": cls.class_name,  # Map class_name to name for consistency
        }
        for cls in classes
    ]
    return JsonResponse(class_list, safe=False)


@api.get("/questions/", response=List[QuestionOut])
def get_questions(request):
    try:
        questions = Question.objects.all()
        return [
            QuestionOut(
                id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                correct_answer=question.correct_answer,
                choices=question.choices or [],  # Use or [] to handle None
                created_by=(
                    question.created_by.username if question.created_by else "Unknown"
                ),
                is_in_bank=question.is_in_bank,
            )
            for question in questions
        ]
    except Exception as e:
        # Handle exception by returning JSON error message
        return JsonResponse(
            {"detail": f"Failed to fetch questions: {str(e)}"}, status=500
        )
@api.get("/profile/")
def get_profile(request):
    try:
        # Authenticate the user using JWT
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)  # Authenticate the request and get the user
        if not user:
            raise AuthenticationFailed("Authentication required.")
        
        # Log the authenticated user
        print(f"Authenticated user: {user.username}, {user.email}, {user.role}")

        # Return the user details
        return {
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }

    except AuthenticationFailed as e:
        # In case of authentication failure, log the error
        print(f"Authentication failed: {str(e)}")
        return JsonResponse({"detail": "Authentication required."}, status=401)




@api.put("/profile/update/")
def update_profile(request, data: ProfileUpdateSchema):
    try:
        # Authenticate the user using JWTAuthentication
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        
        # If no user is authenticated, raise an AuthenticationFailed exception
        if not user:
            raise AuthenticationFailed("Authentication required.")
        
        print(f"Updating profile for user: {user.username}")
        
        # Update user details based on the input
        user.username = data.username
        user.email = data.email
        user.role = data.role

        # Save the updated user data to the database
        user.save()

        # Return a success response with the updated details
        return {
            "message": "Profile updated successfully.",
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }

    except AuthenticationFailed as e:
        # Log the error and return an authentication error response
        print(f"Authentication failed: {str(e)}")
        return JsonResponse({"detail": str(e)}, status=401)

    except Exception as e:
        # Handle any other unexpected errors
        print(f"An error occurred: {str(e)}")
        return JsonResponse({"detail": "An error occurred while updating the profile."}, status=500)

@api.put("/profile/password/")
def update_password(request, data: PasswordUpdateSchema):
    try:
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        if not user:
            return JsonResponse({"detail": "Authentication required."}, status=401)

        # Check if the current password is correct
        if not user.check_password(data.current_password):
            return JsonResponse({"detail": "Current password is incorrect."}, status=400)

        # Update the user's password
        user.set_password(data.new_password)
        user.save()

        return {"message": "Password updated successfully."}

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

@api.post("/join-class/")
def join_class(request, data: JoinClassSchema):
    try:
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        print(f"Attempting to join class with password: {data.password}")

        # Search for the class by password
        class_instance = Class.objects.filter(password=data.password).first()
        
        if not class_instance:
            return JsonResponse({"detail": "Class not found or incorrect password"}, status=404)
        
        # Check if the class is already full
        if class_instance.students.count() >= class_instance.max_students:
            return JsonResponse({"detail": "Class is full"}, status=400)
        
        # Check if the user is already a member of the class
        if class_instance.students.filter(id=user.id).exists():
            return JsonResponse({"detail": "User is already enrolled in this class"}, status=400)

        # Add the student to the class (adding to ManyToMany relation)
        class_instance.students.add(user)

        # Create a ClassMembership record if it doesn't already exist
        ClassMembership.objects.get_or_create(class_id=class_instance, student_id=user)
        
        return JsonResponse({"detail": "Successfully joined the class"})

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)


@api.get("/joined-classes/", response=list[JoinedClassSchema])
def get_joined_classes(request):
    try:
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        
        # Ensure the user is authenticated
        if not user.is_authenticated:
            return JsonResponse({"detail": "Authentication required"}, status=401)

        # Query the ClassMembership model to get the classes the user has joined
        memberships = ClassMembership.objects.filter(student_id=user)

        # Check if there are any memberships
        if not memberships.exists():
            return JsonResponse({"detail": "No classes found for this user"}, status=404)

        # Prepare a list of class details to return
        joined_classes = []
        for membership in memberships:
            class_instance = membership.class_id
            joined_classes.append({
                "class_id": class_instance.id,
                "class_name": class_instance.class_name,
                "teacher_name": class_instance.teacher.username,
                "max_students": class_instance.max_students,
                "enrolled_students_count": class_instance.students.count()
            })

        return JsonResponse(joined_classes, safe=False)

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

@api.post("/add-question/")
def add_question(request, data: QuestionSchema):
    try:
        # Authenticate the user using JWT from the Authorization header
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)

        if not user:
            raise AuthenticationFailed("Authentication required.")

        # Validation for True/False questions
        if (
            data.question_type == "true or false"
            and data.correct_answer.lower() not in ["true", "false"]
        ):
            return JsonResponse(
                {
                    "error": "True or False questions require a correct answer of 'True' or 'False'."
                },
                status=400,
            )

        # Create the question in the database
        question = Question.objects.create(
            question_text=data.question_text,
            question_type=data.question_type,
            correct_answer=data.correct_answer.lower(),
            choices=data.choices if data.choices else [],
            created_by=user,  # Use the authenticated user
            is_in_bank=True,
        )

        return JsonResponse(
            {
                "id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
            }
        )

    except AuthenticationFailed:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    except Exception as e:
        return JsonResponse({"detail": f"Error adding question: {str(e)}"}, status=500)


# Delete a Question Endpoint
@api.delete("/questions/{question_id}/")
def delete_question(request, question_id: int):
    try:
        question = Question.objects.get(id=question_id)
        question.delete()
        return JsonResponse({"detail": "Question deleted successfully."})
    except Question.DoesNotExist:
        return JsonResponse({"detail": "Question not found."}, status=404)
    except Exception as e:
        return JsonResponse(
            {"detail": f"Error deleting question: {str(e)}"}, status=500
        )


# Get a Single Question Endpoint
@api.get("/questions/{question_id}/", response=QuestionOut)
def get_question(request, question_id: int):
    try:
        question = Question.objects.get(id=question_id)
        return QuestionOut(
            id=question.id,
            question_text=question.question_text,
            question_type=question.question_type,
            correct_answer=question.correct_answer,
            choices=question.choices,
            created_by=question.created_by.username,
            is_in_bank=question.is_in_bank,
        )
    except Question.DoesNotExist:
        return JsonResponse({"detail": "Question not found."}, status=404)
    except Exception as e:
        return JsonResponse(
            {"detail": f"Error fetching question: {str(e)}"}, status=500
        )


@api.patch("/update-question/{question_id}/", response=QuestionOut)
def update_question(request, question_id: int, data: QuestionSchema):
    try:
        # Fetch the question by its ID
        question = Question.objects.get(id=question_id)

        # Update the fields from the provided data if they are not None
        updated = False
        if (
            data.question_text is not None
            and question.question_text != data.question_text
        ):
            question.question_text = data.question_text
            updated = True

        if (
            data.question_type is not None
            and question.question_type != data.question_type
        ):
            question.question_type = data.question_type
            updated = True

        if (
            data.correct_answer is not None
            and question.correct_answer != data.correct_answer
        ):
            question.correct_answer = data.correct_answer
            updated = True

        if data.choices is not None and question.choices != data.choices:
            question.choices = data.choices
            updated = True

        if updated:
            # Save the updated question to the database
            question.save()

        # Serialize the question object using the QuestionOut schema
        question_out = convert_to_pydantic(question)

        # Return the updated question details as a JsonResponse
        return JsonResponse(question_out.dict(), status=200)

    except Question.DoesNotExist:
        return JsonResponse({"error": "Question not found"}, status=404)

    except ValidationError as e:
        return JsonResponse({"error": f"Validation error: {str(e)}"}, status=400)

    except Exception as e:
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=400)


# Example conversion function
def convert_to_pydantic(question):
    question_out = QuestionOut(
        id=question.id,
        question_text=question.question_text,
        question_type=question.question_type,
        correct_answer=question.correct_answer,
        choices=question.choices or [],
        created_by=question.created_by.username,  # Use username from User model
        is_in_bank=question.is_in_bank,
    )
    return question_out

@api.get("classes/{class_id}/quizzes", response=List[QuizOut])
def get_class_quizzes(request, class_id: int):
    """
    Fetch all quizzes for a specific class.
    """
    class_instance = get_object_or_404(Class, id=class_id)
    quizzes = Quiz.objects.filter(class_id=class_instance)

    # Include `class_name` dynamically
    return [
        QuizOut(
            id=quiz.id,
            quiz_name=quiz.quiz_name,
            class_name=class_instance.class_name,
            schedule_start=quiz.schedule_start,
            schedule_end=quiz.schedule_end,
            duration_minutes=quiz.duration_minutes,
            created_at=quiz.created_at,
        )
        for quiz in quizzes
    ]
@api.get("/quiz/{quiz_id}", response=QuizOut)
def get_quiz_details(request, quiz_id: int):
    # Fetch the quiz object along with related class and other details
    quiz = get_object_or_404(Quiz, id=quiz_id)

    # Map the quiz object to the QuizOut schema
    quiz_details = QuizOut(
        id=quiz.id,
        quiz_name=quiz.quiz_name,  # Assuming a 'name' field for the quiz name
        class_name=quiz.class_id.class_name,  # Class name related to the quiz
        schedule_start=quiz.schedule_start,  # Assuming a 'schedule_start' field in Quiz
        schedule_end=quiz.schedule_end,  # Assuming a 'schedule_end' field in Quiz
        duration_minutes=quiz.duration_minutes,  # Assuming a 'duration_minutes' field in Quiz
        created_at=quiz.created_at,  # Assuming a 'created_at' field in Quiz
    )

    return quiz_details


@api.post("/quiz-question/")
def add_question_to_quiz(request, data: AddQuestionToQuizSchema):
    try:
        quiz = Quiz.objects.get(id=data.quiz_id)
        question = Question.objects.get(id=data.question_id)
        QuizQuestion.objects.create(quiz_id=quiz, question_id=question)
        return JsonResponse(
            {"message": "Question added to quiz successfully!"}, status=200
        )
    except Quiz.DoesNotExist:
        return JsonResponse({"error": "Quiz not found"}, status=404)
    except Question.DoesNotExist:
        return JsonResponse({"error": "Question not found"}, status=404)


# Fetch all questions for a specific quiz
@api.get("/quiz/{quiz_id}/questions", response=List[QuizQuestionOut])
def get_questions_for_quiz(request, quiz_id: int):
    print(f"Fetching questions for quiz with ID: {quiz_id}")
    # Fetch the quiz to ensure it exists
    quiz = get_object_or_404(Quiz, id=quiz_id)

    # Fetch questions related to this quiz through QuizQuestion
    quiz_questions = QuizQuestion.objects.filter(quiz_id=quiz).select_related("question_id")

    # Serialize the questions using QuizQuestionOut schema
    questions = [
        QuizQuestionOut.from_orm(quiz_question)  # Using the updated schema to serialize
        for quiz_question in quiz_questions
    ]
    print("questions:", questions)
    # Return the serialized questions
    return questions

@api.post("quiz/{quiz_id}/submit", response=SubmitQuizResponse)
def submit_quiz(request, quiz_id: int, data: SubmitQuizRequest):
    try:
        print("=== Starting Quiz Submission Process ===")
        
        # Log incoming request details
        print(f"Incoming request: {request}")
        print(f"Received data: {data.dict()}")
        print(f"Quiz ID: {quiz_id}")

        # Authenticate the user using JWT
        auth = JWTAuthentication()
        user, _ = auth.authenticate(request)
        if user is None:
            print("User not authenticated.")
            return JsonResponse({'error': 'User not authenticated.'}, status=401)

        print(f"Authenticated user: {user}")

        # Get the quiz object
        quiz = get_object_or_404(Quiz, id=quiz_id)
        print(f"Fetched quiz: {quiz}")

        # Check if the quiz is available for submission
        if not quiz.is_active:
            print("Attempt to submit an inactive quiz.")
            return JsonResponse({'error': 'This quiz is not available for submission.'}, status=400)

        # List to hold all the responses
        responses = []

        # Iterate through all the answers submitted by the user
        for answer_data in data.answers:
            question_id = answer_data.question_id
            student_answer = answer_data.answer
            print(f"Processing answer: Question ID={question_id}, Student Answer={student_answer}")

            try:
                print(f"Looking up QuizQuestion with question_id={question_id} and quiz_id={quiz.id}")
                # Get the QuizQuestion object to link the question to the quiz
                quiz_question = get_object_or_404(QuizQuestion, id=question_id, quiz_id=quiz.id)
                question = quiz_question.question_id  # Access the actual Question object
                print(f"Linked question: {question}")
            except ObjectDoesNotExist:
                print(f"QuizQuestion with question_id={question_id} and quiz_id={quiz.id} does not exist.")
                return JsonResponse({'error': f"Question {question_id} not part of the quiz."}, status=404)

            # Create the response object
            response = Response(
                user=user,
                quiz=quiz,
                question=question,
                student_answer=student_answer,
                correct_answer=question.correct_answer,
            )
            print(f"Created response object: {response}")

            # Check if the student's answer is correct
            response.check_answer()
            print(f"Answer correctness: {response.is_correct}")

            # Add response to list
            responses.append(response)

        # Calculate the score
        correct_answers_count = sum(1 for response in responses if response.is_correct)
        total_questions = len(responses)
        score = (correct_answers_count / total_questions) * 100  # Percentage score
        print(f"Calculated score: {score}, Correct Answers: {correct_answers_count}, Total Questions: {total_questions}")

        # Save the grade for the student
        grade, created = Grade.objects.update_or_create(
            quiz_id=quiz,
            student_id=user,
            defaults={'grade': score}
        )
        print(f"Saved grade: {grade}, Created: {created}")

        # Return the response including both the score and the correct answers count
        print("=== Quiz Submission Process Completed Successfully ===")
        return SubmitQuizResponse(
            message='Quiz submitted successfully!',
            score=score,
            correct_answers=correct_answers_count,
            total_questions=total_questions
        )

    except Exception as e:
        # Log the error and return a generic error message
        print(f"Unexpected error: {str(e)}")
        return JsonResponse({"detail": "An error occurred. Please try again later."}, status=500)
