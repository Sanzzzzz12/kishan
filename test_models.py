import google.generativeai as genai

genai.configure(api_key="AIzaSyARFgfKPMB1J31_x2tOazXkIT43op5mtV8")

for model in genai.list_models():
    print(model.name)
