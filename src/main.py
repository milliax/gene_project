from dotenv import load_dotenv
import os

load_dotenv()

print("env: ",os.getenv("TEST"))