import urllib.request
import urllib.parse
import json
import time
import uuid
import os
import argparse

# Typical ComfyUI local or RunPod server URL (update for RunPod)
SERVER_ADDRESS = os.environ.get("COMFYUI_SERVER_ADDRESS", "127.0.0.1:8188")
CLIENT_ID = str(uuid.uuid4())

def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": CLIENT_ID}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"http://{SERVER_ADDRESS}/prompt", data=data)
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except Exception as e:
        print(f"Error queuing prompt: {e}")
        return None

def get_history(prompt_id):
    req = urllib.request.Request(f"http://{SERVER_ADDRESS}/history/{prompt_id}")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error getting history: {e}")
        return None

def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    try:
        req = urllib.request.Request(f"http://{SERVER_ADDRESS}/view?{url_values}")
        with urllib.request.urlopen(req) as response:
            return response.read()
    except Exception as e:
        print(f"Error fetching image {filename}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Batch generate images via ComfyUI API")
    parser.add_argument("--workflow", default="workflow_api.json", help="Path to workflow JSON file")
    parser.add_argument("--prompt", type=str, help="Override positive prompt text node (assumes node '6' is positive prompt)")
    parser.add_argument("--negative", type=str, help="Override negative prompt text node (assumes node '7' is negative)")
    parser.add_argument("--output", default="./outputs", help="Output directory")
    args = parser.parse_args()

    print(f"AI Beauty - Batch Image Generation Script")
    print(f"Connecting to ComfyUI at {SERVER_ADDRESS}")
    
    os.makedirs(args.output, exist_ok=True)

    try:
        with open(args.workflow, "r", encoding="utf-8") as f:
            workflow = json.load(f)
    except FileNotFoundError:
        print(f"Error: {args.workflow} not found.")
        return
        
    if args.prompt and "6" in workflow:
        workflow["6"]["inputs"]["text"] = args.prompt
        
    if args.negative and "7" in workflow:
        workflow["7"]["inputs"]["text"] = args.negative

    print("Queueing workflow...")
    prompt_res = queue_prompt(workflow)
    if not prompt_res:
        print("Failed to queue prompt. Ensure ComfyUI is running.")
        return
        
    prompt_id = prompt_res['prompt_id']
    print(f"Prompt queued with ID: {prompt_id}")
    
    while True:
        history = get_history(prompt_id)
        if history and prompt_id in history:
            print("Generation complete!")
            outputs = history[prompt_id].get('outputs', {})
            for node_id, node_output in outputs.items():
                if 'images' in node_output:
                    for image in node_output['images']:
                        image_data = get_image(image['filename'], image['subfolder'], image['type'])
                        if image_data is not None:
                            save_path = os.path.join(args.output, image['filename'])
                            with open(save_path, "wb") as f:
                                f.write(image_data)
                            print(f"Saved {save_path}")
            break
        else:
            print("Waiting for generation to finish...")
            time.sleep(3)

if __name__ == "__main__":
    main()
