# Django Project Setup
Follow these steps to set up your Django project:

1. **Clone the repository**:

   ```bash
   git clone <your-repository-url>
   cd <your-project-folder>
   ```

2. **Install `uv`**:

   ```bash
   pip install uv
   ```

3. **Create the virtual environment**:

   ```bash
   uv venv
   ```

4. **Activate the virtual environment**:
   
   - **For Windows**:

     ```bash
     venv\Scripts\activate
     ```

   - **For macOS/Linux**:

     ```bash
     source venv/bin/activate
     ```

5. **Install project dependencies**:

   ```bash
   uv pip install -r requirements.txt
   ```

6. **Navigate to your project folder**:

   ```bash
   cd myproject
   ```

7. **Make migrations**:

   ```bash
   python manage.py makemigrations
   ```

8. **Apply migrations**:

   ```bash
   python manage.py migrate
   ```

9. **Create superuser (optional)**:

   ```bash
   python manage.py createsuperuser
   ```

10. **Start the development server**:

    ```bash
    python manage.py runserver
    ```

Your Django project should now be running at `http://127.0.0.1:8000/`.
