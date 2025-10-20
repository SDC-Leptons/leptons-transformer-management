from supabase import create_client, Client
import os
import json
import requests
import cv2
import numpy as np
from io import BytesIO

# Supabase credentials
url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY","")
supabase: Client = create_client(url, key)

# Class mappings
class_names = {
    'Full wire overload': 0,
    'Loose Joint - Faulty': 1,
    'Loose Joint - Potential': 2,
    'Point Overload - Faulty': 3,
    'normal': 4
}

def download_recorrected_annotations():
    # Function to normalize bounding boxes based on 640x640 resize
    def normalize_bbox(bbox, img_width, img_height, target_width=640, target_height=640):
        # Rescale to 640x640 while maintaining aspect ratio
        x_center = (bbox[0] + bbox[2]) / 2.0
        y_center = (bbox[1] + bbox[3]) / 2.0
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]

        # Resizing logic: Since image will be resized to 640, normalize accordingly
        x_center_resized = x_center / img_width * target_width
        y_center_resized = y_center / img_height * target_height
        width_resized = width / img_width * target_width
        height_resized = height / img_height * target_height

        return [x_center_resized / target_width, y_center_resized / target_height, width_resized / target_width, height_resized / target_height]

    # Function to download image and get its dimensions
    def download_image(image_url, save_path):
        response = requests.get(image_url)
        with open(save_path, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded image to {save_path}")

    # Function to get image dimensions using OpenCV
    def get_image_dimensions(image_path):
        img = cv2.imread(image_path)
        return img.shape[1], img.shape[0]  # returns (width, height)

    # Fetch all records from the inspections table
    response = supabase.table("inspections").select("refImage, anomalies").execute()

    # Process the data
    if response.data:
        for row in response.data:
            image_url = row["refImage"]
            anomalies = row["anomalies"]
            anomalies = json.loads(anomalies) if isinstance(anomalies, str) else anomalies
            
            # Extract image name (without extension)
            image_name = os.path.splitext(os.path.basename(image_url))[0]
            
            # Define the path where the image will be saved
            image_save_path = f"dataset/data/train/images/{image_name}.jpg"
            
            # Download the image
            download_image(image_url, image_save_path)
            
            # Get original image dimensions
            img_width, img_height = get_image_dimensions(image_save_path)

            # Create YOLO label file for each image
            label_file_path = f"dataset/data/train/labels/{image_name}.txt"
            with open(label_file_path, "w") as label_file:
                for anomaly in anomalies:
                    class_name = anomaly["class"]
                    class_index = class_names.get(class_name, None)

                    if class_index is not None:
                        # Normalize bounding box for 640x640 resize
                        normalized_bbox = normalize_bbox(anomaly["box"], img_width, img_height)
                        # Write in YOLO format: class_index, x_center, y_center, width, height
                        label_file.write(f"{class_index} {' '.join(map(str, normalized_bbox))}\n")
            print(f"Created label file: {label_file_path}")
        print("✅ All recorrected annotations downloaded and label files created.")
        print("✅ Total records processed:", len(response.data))
        print("✅ Total datapoints for training:", len(os.listdir("dataset/data/train/images/")))

    else:
        print("No data found or error:", response.error)
