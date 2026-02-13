import google.generativeai as genai

genai.configure(api_key="AIzaSyAyj3r5YwhKm_g2vSwrIJP894GeKznP2ls") # உங்க கீ

print("Available Models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)