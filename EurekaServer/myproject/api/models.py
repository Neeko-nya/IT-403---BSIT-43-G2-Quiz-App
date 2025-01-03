from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    role_choices = [("teacher", "Teacher"), ("student", "Student")]
    role = models.CharField(max_length=10, choices=role_choices)
    username = models.CharField(max_length=150, unique=True)

    @property
    def api_user(self):
        """
        Returns a dictionary with the user's essential data: username and password.
        (Note: It's not recommended to expose the raw password in most cases.)
        """
        return {
            "username": self.username,
            "password": self.password, 
        }

class Class(models.Model):
    class_name = models.CharField(max_length=255)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="classes")
    password = models.CharField(max_length=255, blank=True, null=True)
    max_students = models.IntegerField(default=30)
    students = models.ManyToManyField(User, related_name="enrolled_classes", blank=True)

    def __str__(self):
        return self.class_name

    def enrolled_student_usernames(self):
        # Return a list of enrolled student usernames
        return [student.username for student in self.students.all()]

    def enrolled_students_count(self):
        # Return the number of students enrolled in the class
        return self.students.count()


class ClassMembership(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE)
    student_id = models.ForeignKey(User, on_delete=models.CASCADE)


class Quiz(models.Model):
    quiz_name = models.CharField(max_length=255)
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE)
    schedule_start = models.DateTimeField()
    schedule_end = models.DateTimeField()
    duration_minutes = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # Add this field


class Question(models.Model):
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=50,
        choices=[
            ("identification", "Identification"),
            ("multiple choice", "Multiple Choice"),
            ("enumeration", "Enumeration"),
            ("true or false", "True or False"),  # Added True or False type
        ],
    )
    correct_answer = (
        models.JSONField()
    )  # Allowing multiple correct answers or complex answers
    choices = models.JSONField(null=True, blank=True)  # Only for MCQs
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_in_bank = models.BooleanField(default=False)


class QuizQuestion(models.Model):
    quiz_id = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_id = models.ForeignKey(Question, on_delete=models.CASCADE)


class Response(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    student_answer = models.TextField()  # The answer submitted by the student
    correct_answer = models.TextField(default="")  # Default empty string for existing rows
    is_correct = models.BooleanField(default=False)  # Whether the student's answer is correct

    def check_answer(self):
        normalized_student_answer = self.student_answer.strip().lower()
        normalized_correct_answer = self.correct_answer.strip().lower()

        # Update only if the correctness has changed
        self.is_correct = normalized_student_answer == normalized_correct_answer

        # Only save if the correctness has changed
        if self.is_correct != (normalized_student_answer == normalized_correct_answer):
            self.save()

        return self.is_correct

class Grade(models.Model):
    quiz_id = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student_id = models.ForeignKey(User, on_delete=models.CASCADE)
    grade = models.FloatField()

