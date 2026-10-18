
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()

client = OpenAI(
api_key=os.getenv("OPENAI_API_KEY")
)

response = client.responses.create(
    model=os.environ["OPENAI_MODEL"],
    input="Return JSON with status HEALTHY and message API connection successful."
)

print(response.output_text)
