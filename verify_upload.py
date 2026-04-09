
import os
import sys
import tempfile
import uuid

# Add backend to path
sys.path.append(os.path.abspath('.'))

def test_temp_path():
    try:
        temp_filename = f"{uuid.uuid4().hex}_test.pdf"
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, temp_filename)
        print(f"Generated temp path: {temp_path}")
        
        with open(temp_path, "wb") as f:
            f.write(b"dummy pdf content")
        
        if os.path.exists(temp_path):
            print("File successfully written to temp path")
            os.remove(temp_path)
            print("File cleaned up")
            return True
        else:
            print("File NOT found at temp path")
            return False
    except Exception as e:
        print(f"Test failed with error: {e}")
        return False

if __name__ == "__main__":
    if test_temp_path():
        print("TEMPPATH_VERIFICATION_SUCCESS")
    else:
        print("TEMPPATH_VERIFICATION_FAILURE")
