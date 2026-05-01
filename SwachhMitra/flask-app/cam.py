import cv2
import torch
import numpy as np
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define waste type mapping for all 80 COCO classes
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

# Load YOLOv5 model
def load_yolo_model(model_name='yolov5s'):
    """
    Load the pre-trained YOLOv5 model from Ultralytics.
    
    Args:
        model_name (str): YOLOv5 model variant (e.g., 'yolov5s' for small model).
    
    Returns:
        torch.hub.model: Loaded YOLOv5 model or None if loading fails.
    """
    try:
        model = torch.hub.load('ultralytics/yolov5', model_name, pretrained=True, trust_repo=True)
        logger.info("YOLOv5 model %s loaded successfully", model_name)
        return model
    except Exception as e:
        logger.error("Failed to load YOLOv5 model: %s", str(e))
        return None

# Perform waste detection and classification
def detect_and_classify(model, frame):
    """
    Detect and classify waste in the frame using YOLOv5.
    
    Args:
        model: YOLOv5 model.
        frame (np.ndarray): Input frame.
    
    Returns:
        list: List of detections with class, confidence, and bounding box.
    """
    try:
        # Convert frame to RGB (YOLOv5 expects RGB)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        with torch.no_grad():  # Suppress autocast warning
            results = model(frame_rgb)
        detections = results.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2, conf, class]
        
        output = []
        for det in detections:
            x1, y1, x2, y2, conf, cls = det
            class_name = model.names[int(cls)].lower()
            if class_name in WASTE_TYPE_MAP and conf > 0.5:
                waste_name, waste_type, disposal = WASTE_TYPE_MAP[class_name]
                if waste_type != 'Not Waste':  # Filter out non-waste items
                    output.append((waste_name, waste_type, disposal, conf, (int(x1), int(y1), int(x2), int(y2))))
        return output
    except Exception as e:
        logger.error("Error during detection: %s", str(e))
        return []

# Draw bounding box and labels on frame
def draw_bounding_box(frame, waste_name, waste_type, disposal, confidence, box_coords):
    """
    Draw bounding box and labels on the frame.
    
    Args:
        frame (np.ndarray): Input frame.
        waste_name (str): Name of the detected waste.
        waste_type (str): Type of waste (dry, wet, hazardous).
        disposal (str): Suggested disposal bin.
        confidence (float): Prediction confidence.
        box_coords (tuple): Bounding box coordinates (x1, y1, x2, y2).
    
    Returns:
        np.ndarray: Frame with drawn annotations.
    """
    try:
        x1, y1, x2, y2 = box_coords
        # Draw rectangle (green box)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # Prepare label text
        label = f"{waste_name} ({waste_type}): {disposal} ({confidence:.2f})"
        # Draw label background
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(frame, (x1, y1 - label_size[1] - 10), (x1 + label_size[0], y1), (0, 255, 0), -1)
        # Draw label text
        cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        return frame
    except Exception as e:
        logger.error("Error drawing bounding box: %s", str(e))
        return frame

# Main function to run the waste detection system
def main():
    """
    Main function to capture camera feed, detect waste, and display results using YOLOv5.
    """
    # Load model
    model = load_yolo_model('yolov5s')
    if model is None:
        logger.error("Exiting due to model loading failure")
        return
    
    # Initialize camera
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        logger.error("Cannot open camera")
        return
    
    # Initialize video writer as fallback
    output_path = 'output.avi'
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = None
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.error("Failed to grab frame")
                break
            
            # Detect and classify waste
            detections = detect_and_classify(model, frame)
            
            # Draw bounding boxes for all detections
            for waste_name, waste_type, disposal, confidence, box_coords in detections:
                frame = draw_bounding_box(frame, waste_name, waste_type, disposal, confidence, box_coords)
            
            # Try displaying the frame
            try:
                cv2.imshow('Waste Detection', frame)
            except cv2.error as e:
                logger.warning("Failed to display frame: %s. Saving to video file instead.", str(e))
                if out is None and frame is not None:
                    h, w = frame.shape[:2]
                    out = cv2.VideoWriter(output_path, fourcc, 20.0, (w, h))
                if out is not None:
                    out.write(frame)
            
            # Exit on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                logger.info("Exiting on user request")
                break
    
    except Exception as e:
        logger.error("Error in main loop: %s", str(e))
    
    finally:
        # Clean up
        cap.release()
        if out is not None:
            out.release()
        try:
            cv2.destroyAllWindows()
        except cv2.error as e:
            logger.warning("Failed to close windows: %s", str(e))
        logger.inforoe("Camera released and resources cleaned up")

if __name__ == "__main__":
    main()
