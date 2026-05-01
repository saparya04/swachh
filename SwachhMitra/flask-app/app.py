# from flask import Flask, Response, request, jsonify
# import cv2
# import torch
# import numpy as np
# import logging
# import warnings
# import base64

# # Suppress warnings
# warnings.filterwarnings("ignore", category=FutureWarning)
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = Flask(__name__)

# # Load YOLOv5 model
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

# # Waste mapping
# WASTE_TYPE_MAP = {
    # 'person': ('Person', 'Not Waste', 'None'),
    # 'bicycle': ('Bicycle', 'Not Waste', 'None'),
    # 'car': ('Car', 'Not Waste', 'None'),
    # 'motorcycle': ('Motorcycle', 'Not Waste', 'None'),
    # 'airplane': ('Airplane', 'Not Waste', 'None'),
    # 'bus': ('Bus', 'Not Waste', 'None'),
    # 'train': ('Train', 'Not Waste', 'None'),
    # 'truck': ('Truck', 'Not Waste', 'None'),
    # 'boat': ('Boat', 'Not Waste', 'None'),
    # 'traffic light': ('Traffic Light', 'Not Waste', 'None'),
    # 'fire hydrant': ('Fire Hydrant', 'Not Waste', 'None'),
    # 'stop sign': ('Stop Sign', 'Dry', 'Blue Bin'),
    # 'parking meter': ('Parking Meter', 'Not Waste', 'None'),
    # 'bench': ('Bench', 'Not Waste', 'None'),
    # 'bird': ('Bird', 'Not Waste', 'None'),
    # 'cat': ('Cat', 'Not Waste', 'None'),
    # 'dog': ('Dog', 'Not Waste', 'None'),
    # 'horse': ('Horse', 'Not Waste', 'None'),
    # 'sheep': ('Sheep', 'Not Waste', 'None'),
    # 'cow': ('Cow', 'Not Waste', 'None'),
    # 'elephant': ('Elephant', 'Not Waste', 'None'),
    # 'bear': ('Bear', 'Not Waste', 'None'),
    # 'zebra': ('Zebra', 'Not Waste', 'None'),
    # 'giraffe': ('Giraffe', 'Not Waste', 'None'),
    # 'backpack': ('Backpack', 'Dry', 'Blue Bin'),
    # 'umbrella': ('Umbrella', 'Dry', 'Blue Bin'),
    # 'handbag': ('Handbag', 'Dry', 'Blue Bin'),
    # 'tie': ('Tie', 'Dry', 'Blue Bin'),
    # 'suitcase': ('Suitcase', 'Dry', 'Blue Bin'),
    # 'frisbee': ('Frisbee', 'Dry', 'Blue Bin'),
    # 'skis': ('Skis', 'Dry', 'Blue Bin'),
    # 'snowboard': ('Snowboard', 'Dry', 'Blue Bin'),
    # 'sports ball': ('Sports Ball', 'Dry', 'Blue Bin'),
    # 'kite': ('Kite', 'Dry', 'Blue Bin'),
    # 'baseball bat': ('Baseball Bat', 'Dry', 'Blue Bin'),
    # 'baseball glove': ('Baseball Glove', 'Dry', 'Blue Bin'),
    # 'skateboard': ('Skateboard', 'Dry', 'Blue Bin'),
    # 'surfboard': ('Surfboard', 'Dry', 'Blue Bin'),
    # 'tennis racket': ('Tennis Racket', 'Dry', 'Blue Bin'),
    # 'bottle': ('Plastic Bottle', 'Dry', 'Blue Bin'),
    # 'wine glass': ('Wine Glass', 'Dry', 'Blue Bin'),
    # 'cup': ('Plastic Cup', 'Dry', 'Blue Bin'),
    # 'fork': ('Fork', 'Dry', 'Blue Bin'),
    # 'knife': ('Knife', 'Dry', 'Blue Bin'),
    # 'spoon': ('Spoon', 'Dry', 'Blue Bin'),
    # 'bowl': ('Bowl', 'Dry', 'Blue Bin'),
    # 'banana': ('Banana', 'Wet', 'Green Bin'),
    # 'apple': ('Apple', 'Wet', 'Green Bin'),
    # 'sandwich': ('Sandwich', 'Wet', 'Green Bin'),
    # 'orange': ('Orange', 'Wet', 'Green Bin'),
    # 'broccoli': ('Broccoli', 'Wet', 'Green Bin'),
    # 'carrot': ('Carrot', 'Wet', 'Green Bin'),
    # 'hot dog': ('Hot Dog', 'Wet', 'Green Bin'),
    # 'pizza': ('Pizza', 'Wet', 'Green Bin'),
    # 'donut': ('Donut', 'Wet', 'Green Bin'),
    # 'cake': ('Cake', 'Wet', 'Green Bin'),
    # 'chair': ('Chair', 'Not Waste', 'None'),
    # 'couch': ('Couch', 'Not Waste', 'None'),
    # 'potted plant': ('Potted Plant', 'Wet', 'Green Bin'),
    # 'bed': ('Bed', 'Not Waste', 'None'),
    # 'dining table': ('Dining Table', 'Not Waste', 'None'),
    # 'toilet': ('Toilet', 'Not Waste', 'None'),
    # 'tv': ('TV', 'Hazardous', 'Red Bin'),
    # 'laptop': ('Laptop', 'Hazardous', 'Red Bin'),
    # 'mouse': ('Computer Mouse', 'Hazardous', 'Red Bin'),
    # 'remote': ('Remote', 'Hazardous', 'Red Bin'),
    # 'keyboard': ('Keyboard', 'Hazardous', 'Red Bin'),
    # 'cell phone': ('Cell Phone', 'Hazardous', 'Red Bin'),
    # 'microwave': ('Microwave', 'Hazardous', 'Red Bin'),
    # 'oven': ('Oven', 'Not Waste', 'None'),
    # 'toaster': ('Toaster', 'Hazardous', 'Red Bin'),
    # 'sink': ('Sink', 'Not Waste', 'None'),
    # 'refrigerator': ('Refrigerator', 'Not Waste', 'None'),
    # 'book': ('Book', 'Dry', 'Blue Bin'),
    # 'clock': ('Clock', 'Hazardous', 'Red Bin'),
    # 'vase': ('Vase', 'Dry', 'Blue Bin'),
    # 'scissors': ('Scissors', 'Dry', 'Blue Bin'),
    # 'teddy bear': ('Teddy Bear', 'Dry', 'Blue Bin'),
    # 'hair drier': ('Hair Drier', 'Hazardous', 'Red Bin'),
    # 'toothbrush': ('Toothbrush', 'Dry', 'Blue Bin')
# }

# def process_frame(frame):
#     """Core logic to run YOLO and draw green boxes"""
#     results = model(frame)
#     detections = results.xyxy[0].cpu().numpy()
#     # Inside your detection loop in app.py
#     for det in detections:
#         x1, y1, x2, y2, conf, cls = det
#         if conf > 0.4:
#             # 1. Draw a THICKER Green Box (Changed thickness from 2 to 5)
#             cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 5)
            
#             label_text = f"{model.names[int(cls)].upper()} {conf:.2f}"
            
#             # 2. Draw a background rectangle for the text (makes it readable)
#             # Get text size for the background box
#             (w, h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
#             cv2.rectangle(frame, (int(x1), int(y1) - h - 15), (int(x1) + w, int(y1)), (0, 255, 0), -1)

#             # 3. Draw LARGER and BOLER text in Black (for contrast)
#             # Font scale increased to 1.2, thickness to 3
#             cv2.putText(frame, label_text, (int(x1), int(y1) - 10), 
#                         cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 3)
#     return frame

# # --- ENDPOINT FOR LAPTOP WEBCAM ---
# def generate_frames():
#     cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
#     while True:
#         success, frame = cap.read()
#         if not success: break
#         frame = process_frame(frame)
#         ret, buffer = cv2.imencode('.jpg', frame)
#         yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
#     cap.release()

# @app.route('/video_feed')
# def video_feed():
#     return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


# @app.route('/classify_frame', methods=['POST'])
# def classify_frame():
#     try:
#         data = request.json['image']
#         img_bytes = base64.b64decode(data)
#         nparr = np.frombuffer(img_bytes, np.uint8)
#         frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#         results = model(frame)
#         detections = results.xyxy[0].cpu().numpy()
        
#         detected_label = "None"
#         detected_category = "Scanning..."

#         for det in detections:
#             x1, y1, x2, y2, conf, cls = det
#             if conf > 0.4:
#                 class_name = model.names[int(cls)].lower()
                
#                 # Check your mapping for the category (Wet/Dry/Hazardous)
#                 if class_name in WASTE_TYPE_MAP:
#                     waste_info = WASTE_TYPE_MAP[class_name]
#                     detected_label = waste_info[0]    # e.g. "Plastic Bottle"
#                     detected_category = waste_info[1] # e.g. "Dry"
                
#                 # Draw the box for the image stream
#                 cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 5)

#         _, buffer = cv2.imencode('.jpg', frame)
#         encoded_image = base64.b64encode(buffer).decode('utf-8')
        
#         return jsonify({
#             'image': encoded_image,
#             'label': detected_label,
#             'category': detected_category # Sent to frontend for the big text card
#         })
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# if __name__ == "__main__":
#     print("--- Flask Server Starting on Port 5001 ---")
#     app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import torch
import numpy as np
import base64
import warnings

# Speed optimizations
warnings.filterwarnings("ignore", category=FutureWarning)
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)
CORS(app)

# Load model to GPU if available, else CPU
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True).to(device)

WASTE_TYPE_MAP = {
    'person': ('Person', 'Not Waste', 'None'),
    'bicycle': ('Bicycle', 'Not Waste', 'None'),
    'car': ('Car', 'Not Waste', 'None'),
    'motorcycle': ('Motorcycle', 'Not Waste', 'None'),
    'airplane': ('Airplane', 'Not Waste', 'None'),
    'bus': ('Bus', 'Not Waste', 'None'),
    'train': ('Train', 'Not Waste', 'None'),
    'truck': ('Truck', 'Not Waste', 'None'),
    'boat': ('Boat', 'Not Waste', 'None'),
    'traffic light': ('Traffic Light', 'Not Waste', 'None'),
    'fire hydrant': ('Fire Hydrant', 'Not Waste', 'None'),
    'stop sign': ('Stop Sign', 'Dry', 'Blue Bin'),
    'parking meter': ('Parking Meter', 'Not Waste', 'None'),
    'bench': ('Bench', 'Not Waste', 'None'),
    'bird': ('Bird', 'Not Waste', 'None'),
    'cat': ('Cat', 'Not Waste', 'None'),
    'dog': ('Dog', 'Not Waste', 'None'),
    'horse': ('Horse', 'Not Waste', 'None'),
    'sheep': ('Sheep', 'Not Waste', 'None'),
    'cow': ('Cow', 'Not Waste', 'None'),
    'elephant': ('Elephant', 'Not Waste', 'None'),
    'bear': ('Bear', 'Not Waste', 'None'),
    'zebra': ('Zebra', 'Not Waste', 'None'),
    'giraffe': ('Giraffe', 'Not Waste', 'None'),
    'backpack': ('Backpack', 'Dry', 'Blue Bin'),
    'umbrella': ('Umbrella', 'Dry', 'Blue Bin'),
    'handbag': ('Handbag', 'Dry', 'Blue Bin'),
    'tie': ('Tie', 'Dry', 'Blue Bin'),
    'suitcase': ('Suitcase', 'Dry', 'Blue Bin'),
    'frisbee': ('Frisbee', 'Dry', 'Blue Bin'),
    'skis': ('Skis', 'Dry', 'Blue Bin'),
    'snowboard': ('Snowboard', 'Dry', 'Blue Bin'),
    'sports ball': ('Sports Ball', 'Dry', 'Blue Bin'),
    'kite': ('Kite', 'Dry', 'Blue Bin'),
    'baseball bat': ('Baseball Bat', 'Dry', 'Blue Bin'),
    'baseball glove': ('Baseball Glove', 'Dry', 'Blue Bin'),
    'skateboard': ('Skateboard', 'Dry', 'Blue Bin'),
    'surfboard': ('Surfboard', 'Dry', 'Blue Bin'),
    'tennis racket': ('Tennis Racket', 'Dry', 'Blue Bin'),
    'bottle': ('Plastic Bottle', 'Dry', 'Blue Bin'),
    'wine glass': ('Wine Glass', 'Dry', 'Blue Bin'),
    'cup': ('Plastic Cup', 'Dry', 'Blue Bin'),
    'fork': ('Fork', 'Dry', 'Blue Bin'),
    'knife': ('Knife', 'Dry', 'Blue Bin'),
    'spoon': ('Spoon', 'Dry', 'Blue Bin'),
    'bowl': ('Bowl', 'Dry', 'Blue Bin'),
    'banana': ('Banana', 'Wet', 'Green Bin'),
    'apple': ('Apple', 'Wet', 'Green Bin'),
    'sandwich': ('Sandwich', 'Wet', 'Green Bin'),
    'orange': ('Orange', 'Wet', 'Green Bin'),
    'broccoli': ('Broccoli', 'Wet', 'Green Bin'),
    'carrot': ('Carrot', 'Wet', 'Green Bin'),
    'hot dog': ('Hot Dog', 'Wet', 'Green Bin'),
    'pizza': ('Pizza', 'Wet', 'Green Bin'),
    'donut': ('Donut', 'Wet', 'Green Bin'),
    'cake': ('Cake', 'Wet', 'Green Bin'),
    'chair': ('Chair', 'Not Waste', 'None'),
    'couch': ('Couch', 'Not Waste', 'None'),
    'potted plant': ('Potted Plant', 'Wet', 'Green Bin'),
    'bed': ('Bed', 'Not Waste', 'None'),
    'dining table': ('Dining Table', 'Not Waste', 'None'),
    'toilet': ('Toilet', 'Not Waste', 'None'),
    'tv': ('TV', 'Hazardous', 'Red Bin'),
    'laptop': ('Laptop', 'Hazardous', 'Red Bin'),
    'mouse': ('Computer Mouse', 'Hazardous', 'Red Bin'),
    'remote': ('Remote', 'Hazardous', 'Red Bin'),
    'keyboard': ('Keyboard', 'Hazardous', 'Red Bin'),
    'cell phone': ('Cell Phone', 'Hazardous', 'Red Bin'),
    'microwave': ('Microwave', 'Hazardous', 'Red Bin'),
    'oven': ('Oven', 'Not Waste', 'None'),
    'toaster': ('Toaster', 'Hazardous', 'Red Bin'),
    'sink': ('Sink', 'Not Waste', 'None'),
    'refrigerator': ('Refrigerator', 'Not Waste', 'None'),
    'book': ('Book', 'Dry', 'Blue Bin'),
    'clock': ('Clock', 'Hazardous', 'Red Bin'),
    'vase': ('Vase', 'Dry', 'Blue Bin'),
    'scissors': ('Scissors', 'Dry', 'Blue Bin'),
    'teddy bear': ('Teddy Bear', 'Dry', 'Blue Bin'),
    'hair drier': ('Hair Drier', 'Hazardous', 'Red Bin'),
    'toothbrush': ('Toothbrush', 'Dry', 'Blue Bin')
}

@app.route('/classify_frame', methods=['POST'])
def classify_frame():
    try:
        # 1. Quick Extract
        data = request.json.get('image')
        if not data: return jsonify({'error': 'No data'}), 400
        
        # 2. Fast Base64 Fix
        if "," in data: data = data.split(",")[1]
        missing_padding = len(data) % 4
        if missing_padding: data += '=' * (4 - missing_padding)

        # 3. Decode
        img_bytes = base64.b64decode(data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None: return jsonify({'error': 'Empty frame'}), 400

        # 4. Resize for Speed (AI doesn't need 1080p)
        frame = cv2.resize(frame, (416, 416)) 

        # 5. Inference
        results = model(frame)
        detections = results.xyxy[0].cpu().numpy()

        label, category = "None", "Scanning..."

        if len(detections) > 0:
            best = detections[detections[:, 4].argmax()]
            conf, cls = best[4], int(best[5])
            name = model.names[cls].lower()

            if conf > 0.4 and name in WASTE_TYPE_MAP:
                label, category = WASTE_TYPE_MAP[name]
                color = (0, 255, 0) # Green for live feedback
                cv2.rectangle(frame, (int(best[0]), int(best[1])), (int(best[2]), int(best[3])), color, 2)
                cv2.putText(frame, f"{label}", (int(best[0]), int(best[1])-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # 6. Ultra-High Compression (Quality 25)
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 25])
        encoded_image = base64.b64encode(buffer).decode('utf-8')

        return jsonify({'image': encoded_image, 'label': label, 'category': category})

    except Exception as e:
        return jsonify({'error': 'Internal speed error'}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, threaded=True)