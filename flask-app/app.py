# from flask import Flask, Response, jsonify
# import cv2
# import torch
# import numpy as np

# app = Flask(__name__)

# # Load YOLOv5 model
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

# # Waste mapping from your code
# WASTE_TYPE_MAP = {
#     'person': ('Person', 'Not Waste', 'None'),
#     'bicycle': ('Bicycle', 'Not Waste', 'None'),
#     'car': ('Car', 'Not Waste', 'None'),
#     'motorcycle': ('Motorcycle', 'Not Waste', 'None'),
#     'airplane': ('Airplane', 'Not Waste', 'None'),
#     'bus': ('Bus', 'Not Waste', 'None'),
#     'train': ('Train', 'Not Waste', 'None'),
#     'truck': ('Truck', 'Not Waste', 'None'),
#     'boat': ('Boat', 'Not Waste', 'None'),
#     'traffic light': ('Traffic Light', 'Not Waste', 'None'),
#     'fire hydrant': ('Fire Hydrant', 'Not Waste', 'None'),
#     'stop sign': ('Stop Sign', 'Dry', 'Blue Bin'),
#     'parking meter': ('Parking Meter', 'Not Waste', 'None'),
#     'bench': ('Bench', 'Not Waste', 'None'),
#     'bird': ('Bird', 'Not Waste', 'None'),
#     'cat': ('Cat', 'Not Waste', 'None'),
#     'dog': ('Dog', 'Not Waste', 'None'),
#     'horse': ('Horse', 'Not Waste', 'None'),
#     'sheep': ('Sheep', 'Not Waste', 'None'),
#     'cow': ('Cow', 'Not Waste', 'None'),
#     'elephant': ('Elephant', 'Not Waste', 'None'),
#     'bear': ('Bear', 'Not Waste', 'None'),
#     'zebra': ('Zebra', 'Not Waste', 'None'),
#     'giraffe': ('Giraffe', 'Not Waste', 'None'),
#     'backpack': ('Backpack', 'Dry', 'Blue Bin'),
#     'umbrella': ('Umbrella', 'Dry', 'Blue Bin'),
#     'handbag': ('Handbag', 'Dry', 'Blue Bin'),
#     'tie': ('Tie', 'Dry', 'Blue Bin'),
#     'suitcase': ('Suitcase', 'Dry', 'Blue Bin'),
#     'frisbee': ('Frisbee', 'Dry', 'Blue Bin'),
#     'skis': ('Skis', 'Dry', 'Blue Bin'),
#     'snowboard': ('Snowboard', 'Dry', 'Blue Bin'),
#     'sports ball': ('Sports Ball', 'Dry', 'Blue Bin'),
#     'kite': ('Kite', 'Dry', 'Blue Bin'),
#     'baseball bat': ('Baseball Bat', 'Dry', 'Blue Bin'),
#     'baseball glove': ('Baseball Glove', 'Dry', 'Blue Bin'),
#     'skateboard': ('Skateboard', 'Dry', 'Blue Bin'),
#     'surfboard': ('Surfboard', 'Dry', 'Blue Bin'),
#     'tennis racket': ('Tennis Racket', 'Dry', 'Blue Bin'),
#     'bottle': ('Plastic Bottle', 'Dry', 'Blue Bin'),
#     'wine glass': ('Wine Glass', 'Dry', 'Blue Bin'),
#     'cup': ('Plastic Cup', 'Dry', 'Blue Bin'),
#     'fork': ('Fork', 'Dry', 'Blue Bin'),
#     'knife': ('Knife', 'Dry', 'Blue Bin'),
#     'spoon': ('Spoon', 'Dry', 'Blue Bin'),
#     'bowl': ('Bowl', 'Dry', 'Blue Bin'),
#     'banana': ('Banana', 'Wet', 'Green Bin'),
#     'apple': ('Apple', 'Wet', 'Green Bin'),
#     'sandwich': ('Sandwich', 'Wet', 'Green Bin'),
#     'orange': ('Orange', 'Wet', 'Green Bin'),
#     'broccoli': ('Broccoli', 'Wet', 'Green Bin'),
#     'carrot': ('Carrot', 'Wet', 'Green Bin'),
#     'hot dog': ('Hot Dog', 'Wet', 'Green Bin'),
#     'pizza': ('Pizza', 'Wet', 'Green Bin'),
#     'donut': ('Donut', 'Wet', 'Green Bin'),
#     'cake': ('Cake', 'Wet', 'Green Bin'),
#     'chair': ('Chair', 'Not Waste', 'None'),
#     'couch': ('Couch', 'Not Waste', 'None'),
#     'potted plant': ('Potted Plant', 'Wet', 'Green Bin'),
#     'bed': ('Bed', 'Not Waste', 'None'),
#     'dining table': ('Dining Table', 'Not Waste', 'None'),
#     'toilet': ('Toilet', 'Not Waste', 'None'),
#     'tv': ('TV', 'Hazardous', 'Red Bin'),
#     'laptop': ('Laptop', 'Hazardous', 'Red Bin'),
#     'mouse': ('Computer Mouse', 'Hazardous', 'Red Bin'),
#     'remote': ('Remote', 'Hazardous', 'Red Bin'),
#     'keyboard': ('Keyboard', 'Hazardous', 'Red Bin'),
#     'cell phone': ('Cell Phone', 'Hazardous', 'Red Bin'),
#     'microwave': ('Microwave', 'Hazardous', 'Red Bin'),
#     'oven': ('Oven', 'Not Waste', 'None'),
#     'toaster': ('Toaster', 'Hazardous', 'Red Bin'),
#     'sink': ('Sink', 'Not Waste', 'None'),
#     'refrigerator': ('Refrigerator', 'Not Waste', 'None'),
#     'book': ('Book', 'Dry', 'Blue Bin'),
#     'clock': ('Clock', 'Hazardous', 'Red Bin'),
#     'vase': ('Vase', 'Dry', 'Blue Bin'),
#     'scissors': ('Scissors', 'Dry', 'Blue Bin'),
#     'teddy bear': ('Teddy Bear', 'Dry', 'Blue Bin'),
#     'hair drier': ('Hair Drier', 'Hazardous', 'Red Bin'),
#     'toothbrush': ('Toothbrush', 'Dry', 'Blue Bin')
# }


# def generate_frames():
#     # Use 0 for default webcam or 1 for external
#     camera = cv2.VideoCapture(0) 
#     while True:
#         success, frame = camera.read()
#         if not success:
#             break
#         else:
#             # Inference
#             results = model(frame)
#             detections = results.xyxy[0].cpu().numpy()

#             for det in detections:
#                 x1, y1, x2, y2, conf, cls = det
#                 class_name = model.names[int(cls)].lower()
                
#                 if class_name in WASTE_TYPE_MAP and conf > 0.5:
#                     name, w_type, bin_type = WASTE_TYPE_MAP[class_name]
#                     if w_type != 'Not Waste':
#                         # Draw boxes
#                         cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
#                         label = f"{name} ({w_type})"
#                         cv2.putText(frame, label, (int(x1), int(y1)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

#             # Encode frame
#             ret, buffer = cv2.imencode('.jpg', frame)
#             frame = buffer.tobytes()
#             yield (b'--frame\r\n'
#                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# @app.route('/video_feed')
# def video_feed():
#     return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# if __name__ == "__main__":
#     # Host on 0.0.0.0 so your phone can access it via your PC's IP
#     app.run(host='0.0.0.0', port=5000)

from flask import Flask, Response, request, jsonify
import cv2
import torch
import numpy as np
import logging
import warnings
import base64

# Suppress warnings
warnings.filterwarnings("ignore", category=FutureWarning)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load YOLOv5 model
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

# Waste mapping
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

def process_frame(frame):
    """Core logic to run YOLO and draw green boxes"""
    results = model(frame)
    detections = results.xyxy[0].cpu().numpy()
    # Inside your detection loop in app.py
    for det in detections:
        x1, y1, x2, y2, conf, cls = det
        if conf > 0.4:
            # 1. Draw a THICKER Green Box (Changed thickness from 2 to 5)
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 5)
            
            label_text = f"{model.names[int(cls)].upper()} {conf:.2f}"
            
            # 2. Draw a background rectangle for the text (makes it readable)
            # Get text size for the background box
            (w, h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)
            cv2.rectangle(frame, (int(x1), int(y1) - h - 15), (int(x1) + w, int(y1)), (0, 255, 0), -1)

            # 3. Draw LARGER and BOLER text in Black (for contrast)
            # Font scale increased to 1.2, thickness to 3
            cv2.putText(frame, label_text, (int(x1), int(y1) - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 3)
    # for det in detections:
    #     x1, y1, x2, y2, conf, cls = det
    #     class_name = model.names[int(cls)].lower()
    #     if class_name in WASTE_TYPE_MAP and conf > 0.4:
    #         name, w_type, disposal = WASTE_TYPE_MAP[class_name]
    #         if w_type != 'Not Waste':
    #             # Draw Green Box
    #             cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
    #             label = f"{name} ({w_type})"
    #             cv2.putText(frame, label, (int(x1), int(y1) - 10), 
    #                         cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

# --- ENDPOINT FOR LAPTOP WEBCAM ---
def generate_frames():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    while True:
        success, frame = cap.read()
        if not success: break
        frame = process_frame(frame)
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- ENDPOINT FOR PHONE CAMERA (LIVE) ---
# @app.route('/classify_frame', methods=['POST'])
# def classify_frame():
#     try:
#         data = request.json['image']
#         img_bytes = base64.b64decode(data)
#         nparr = np.frombuffer(img_bytes, np.uint8)
#         frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
#         results = model(frame)
#         detections = results.xyxy[0].cpu().numpy()

#         for det in detections:
#             x1, y1, x2, y2, conf, cls = det
#             if conf > 0.4:
#                 # Draw the Green Box
#                 cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
#                 label = f"{model.names[int(cls)]} {conf:.2f}"
#                 cv2.putText(frame, label, (int(x1), int(y1)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

#         _, buffer = cv2.imencode('.jpg', frame)
#         encoded_image = base64.b64encode(buffer).decode('utf-8')
#         return jsonify({
#             'image': encoded_image,
#             'label': model.names[int(cls)].upper() if len(detections) > 0 else "SCANNING..."
#          })
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# if __name__ == "__main__":
#     app.run(host='0.0.0.0', port=5001)

@app.route('/classify_frame', methods=['POST'])
def classify_frame():
    try:
        data = request.json['image']
        img_bytes = base64.b64decode(data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(frame)
        detections = results.xyxy[0].cpu().numpy()
        
        detected_label = "None"
        detected_category = "Scanning..."

        for det in detections:
            x1, y1, x2, y2, conf, cls = det
            if conf > 0.4:
                class_name = model.names[int(cls)].lower()
                
                # Check your mapping for the category (Wet/Dry/Hazardous)
                if class_name in WASTE_TYPE_MAP:
                    waste_info = WASTE_TYPE_MAP[class_name]
                    detected_label = waste_info[0]    # e.g. "Plastic Bottle"
                    detected_category = waste_info[1] # e.g. "Dry"
                
                # Draw the box for the image stream
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 5)

        _, buffer = cv2.imencode('.jpg', frame)
        encoded_image = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'image': encoded_image,
            'label': detected_label,
            'category': detected_category # Sent to frontend for the big text card
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    print("--- Flask Server Starting on Port 5001 ---")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)