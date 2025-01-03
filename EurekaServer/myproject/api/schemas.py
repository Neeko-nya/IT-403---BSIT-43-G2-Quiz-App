from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
from datetime import datetime


class SignupSchema(BaseModel):
    username: str  # Username for signup
    email: str  # Email for signup
    password: str  # Password for signup
    role: str  # Role (e.g., student, teacher)

    class Config:
        from_attributes = (
            True  # Pydantic V2: Use 'from_attributes' instead of 'orm_mode'
        )


class LoginSchema(BaseModel):
    email: str  # Email or username for login
    password: str  # Password for login


class UserOut(BaseModel):
    username: str  # Username to return in the response
    email: str  # Email to return in the response
    role: str  # Role to return in the response (e.g., student, teacher)
    access_token: str  # JWT access token for authenticated API access

    class Config:
        from_attributes = True  # Pydantic V2: Use 'from_attributes'


class CreateClassSchema(BaseModel):
    class_name: str
    password: str = None  # Optional password field for class
    max_students: int = 30  # Limit the number of students


class AddStudentSchema(BaseModel):
    username: str  # The username of the student to add

    class Config:
        from_attributes = True


class RemoveStudentSchema(BaseModel):
    username: str  # The username of the student to remove

    class Config:
        from_attributes = (
            True  # Pydantic V2: Use 'from_attributes' instead of 'orm_mode'
        )


class ClassOut(BaseModel):
    id: int
    class_name: str
    teacher_name: str
    max_students: int  # Maximum number of students
    enrolled_students: List[str]  # List of enrolled student usernames
    password: str

    class Config:
        arbitrary_types_allowed = True  # Add this line
        from_attributes = True


class JoinClassSchema(BaseModel):
    password: str


class QuizOut(BaseModel):
    id: int
    quiz_name: str
    class_name: str
    schedule_start: datetime
    schedule_end: datetime
    duration_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True


class CreateQuizSchema(BaseModel):
    quiz_name: str
    class_id: int
    schedule_start: datetime
    schedule_end: datetime
    duration_minutes: int


class UpdateQuizSchema(BaseModel):
    quiz_name: str = None
    schedule_start: datetime = None
    schedule_end: datetime = None
    duration_minutes: int = None


class SubmitQuizSchema(BaseModel):
    quiz_id: int
    user_id: int  # ID of the student
    answers: dict  # Dictionary mapping question IDs to answers


class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    correct_answer: str = Field(..., min_length=1)
    choices: Optional[List[str]] = []
    created_by: str  # Change this to string to represent the username or user ID
    is_in_bank: bool

    class Config:
        from_attributes = True

class ProfileUpdateSchema(BaseModel):
    username: str
    email: str
    role: str

class PasswordUpdateSchema(BaseModel):
    current_password: str
    new_password: str

class JoinedClassSchema(BaseModel):
    class_id: int
    user_id: int

    class Config:
        from_attributes = True


class QuestionSchema(BaseModel):
    question_text: Optional[str] = None  # Now optional
    question_type: Optional[str] = None  # Now optional
    correct_answer: Optional[Union[str, List[str]]] = (
        None  # Allow for single or multiple answers
    )
    choices: Optional[List[str]] = (
        []
    )  # Default to empty list if no choices are provided

    class Config:
        str_min_length = 1  # Ensures string fields are not empty globally


class AddQuestionToQuizSchema(BaseModel):
    quiz_id: int
    question_id: int

    class Config:
        orm_mode = True


from pydantic import BaseModel, Field
from typing import List, Optional


class QuizQuestionOut(BaseModel):
    id: int
    question_text: str
    choices: Optional[List[str]] = []  # List of choices, default to an empty list
    correct_answer: str = Field(
        ..., min_length=1
    )  # Correct answer as a string, ensuring it's non-empty
    created_by: str  # The creator of the question
    question_type: str  # Added field for question type

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        obj_dict = obj.__dict__.copy()  # Copy the dictionary of the object

        # Ensure question_text is fetched from the related Question object
        obj_dict["question_text"] = (
            obj.question_id.question_text
        )  # Access question_text from the related Question

        # Ensure correct_answer is fetched from the related Question object
        obj_dict["correct_answer"] = (
            obj.question_id.correct_answer or ""
        )  # Access correct_answer from the related Question

        # Convert the 'created_by' User object to a string (e.g., username)
        obj_dict["created_by"] = (
            obj.question_id.created_by.username if obj.question_id.created_by else None
        )

        # Ensure choices is a list (or empty if None)
        obj_dict["choices"] = (
            obj.question_id.choices or []
        )  # Default to empty list if None

        # Ensure question_type is included from the related Question
        obj_dict["question_type"] = obj.question_id.question_type

        # Return the super class's from_orm method with the cleaned data
        return super().from_orm(obj_dict)

class AnswerData(BaseModel):
    question_id: int
    answer: str

class SubmitQuizRequest(BaseModel):
    answers: List[AnswerData]

class SubmitQuizResponse(BaseModel):
    message: str
    score: int
    total_questions: int
    correct_answers: int
    

class InviteStudentSchema(BaseModel):
    username: str
class RemoveStudentSchema(BaseModel):
    username: str