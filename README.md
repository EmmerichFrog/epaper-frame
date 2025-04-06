# Raspberri PI Zero 2 e-paper picture frame
<p align="center" width="100%">
  <img src="https://github.com/user-attachments/assets/ac1e223f-9d16-4089-95f8-77680bdda7cb" height="512">
</p>

## Description
This is a python application, flask is used to present a web page where a picture can be uploaded, 
some basic picture editing tools are provided to change brightness and crop the picture.

The uploaded image can then be sent to the epaper display. 
The application supports setting the PANEL_TYPE enviroment variable to select the panel type. As of now it supports Waveshare epd7in3f and epd4in0e only, 
but an abstracted panel class is provided to add support for other hardware.
The driver for the board are from Waveshare, with minor modification.

Python implementation of the Floyd-Steinberg dithering algorithm are too slow, even when running under Numba, so the OpenCV implementation is used:
- "Pure" python (still using numpy) takes over 2 minutes to dither an 800x600 image;
- Numba takes between 30 and 60 seconds;
- OpenCV takes around 6 seconds.

It could have been optimized maybe, but the difference is huge and it was out of scope of this project.

## Screenshots
<img src="https://github.com/user-attachments/assets/956c780e-ae93-4f72-9b42-fed2a85bb62f" height="256">
<img src="https://github.com/user-attachments/assets/44d83462-dfe8-4806-83a5-dba8a1a62017" height="256">
<img src="https://github.com/user-attachments/assets/2c82e363-0888-4645-9ca5-8d902432126c" height="256">

## Usage
Install the requirements and run app.py. The code should was only tested on a Pi Zero 2 W, but should work on other models.
By default, the webpage is running on 0.0.0.0:443 with ssl on. An example of a systemd service is included if autorun on boot is desired.

For convenience, some REST api enpoint are exposed:
- GET "/done" = returns if the panel is done refreshing the picture or not;
- GET "/prev", "/next", "/rand" = browse and set through the saved pictures;
- GET "/curr_name" = returns the current image file name;
- GET "/shutdown" = to safely shutdown the Raspberry.
