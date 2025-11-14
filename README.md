# Raspberri PI Zero 2 e-paper picture frame
<p align="center" width="100%">
  <img src="https://github.com/user-attachments/assets/ac1e223f-9d16-4089-95f8-77680bdda7cb" height="512">
</p>

## Description
This is a python application, flask is used to present a web page where a picture can be uploaded, 
some basic picture editing tools are provided to adjust brightness, rotate and crop the picture.

The uploaded image can then be sent to the epaper display. 
The application supports setting the PANEL_TYPE enviroment variable to select the panel type. As of now it supports Waveshare epd7in3f and epd4in0e only, 
but an abstracted panel class is provided to add support for other hardware.
The driver for the board are from Waveshare, with minor modification.

Python implementation of the Floyd-Steinberg dithering algorithm are too slow, even when running under Numba, so the OpenCV implementation is used:
- "Pure" python (still using numpy) takes over 2 minutes to dither an 800x600 image;
- Numba takes between 30 and 60 seconds;
- OpenCV takes around 6 seconds.

It could have been optimized maybe, but the difference is huge and it was out of scope of this project.

The html frontend was moved to https://github.com/EmmerichFrog/ImageEditor

## Screenshots
<p align="center" width="100%">
  <img height="512" alt="image" src="https://github.com/user-attachments/assets/e05203c4-fd4a-4ad2-b04f-06188c56e08a" />
</p>

## Usage
Install the requirements and run app.py. The code should was only tested on a Pi Zero 2 W, but should work on other models.
By default, the webpage is running on 0.0.0.0:443 with ssl on. An example of a systemd service is included if autorun on boot is desired.

For convenience, some REST api enpoint are exposed:
- GET "/done" = returns if the panel is done refreshing the picture or not;
- GET "/prev", "/next", "/rand" = browse and set through the saved pictures;
- GET "/curr_name" = returns the current image file name;
- GET "/shutdown" = to safely shutdown the Raspberry.
