document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const fileInput = document.getElementById("fileInput");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const imageContainer = document.getElementById("imageContainer");
    const header = document.getElementById("header2");
    const headerImg = document.getElementById("headImg");
    const uploadedImage = document.getElementById("uploadedImage");
    const oldCanvas = document.createElement('canvas');
    const tempCanvas = document.createElement('canvas');
    const uploadBtn = document.getElementById("uploadBtn");
    const cropBtn = document.getElementById("cropBtn");
    const shutdownBtn = document.getElementById("shutdownBtn");
    const okBtn = document.getElementById("okBtn");
    const vertBtn = document.getElementById("vertBtn");
    const horBtn = document.getElementById("horBtn");

    const brUpBtn = document.getElementById("brUpBtn");
    const brDwBtn = document.getElementById("brDwBtn");
    const brResBtn = document.getElementById("brResBtn");

    const satUpBtn = document.getElementById("satUpBtn");
    const satDwBtn = document.getElementById("satDwBtn");
    const satResBtn = document.getElementById("satResBtn");

    let cropper;
    let currBr = 100;
    let currSat = 100;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    uploadBtn.addEventListener("click", () => {
        currBr = 100;
        brUpBtn.style.display = "none";
        brDwBtn.style.display = "none";
        brResBtn.style.display = "none";

        satUpBtn.style.display = "none";
        satDwBtn.style.display = "none";
        satResBtn.style.display = "none";

        uploadedImage.style.display = "none"
        uploadedImage.style.marginLeft = " ";
        uploadedImage.style.marginRight = " ";
        const ctx = uploadedImage.getContext('2d');
        ctx.clearRect(0, 0, uploadedImage.width, uploadedImage.height);
        const file = fileInput.files[0];
        if (!file) return alert("Please select a file!");

        progressContainer.style.display = "block";
        progressBar.style.display = "block"
        progressBar.style.width = "0%";
        progressBar.textContent = "0%";
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload", true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                progressBar.style.width = percentComplete + "%";
                progressBar.textContent = percentComplete + "%";
            }
        };

        xhr.onload = async function () {
            if (cropper) { cropper.destroy() };
            const response = JSON.parse(xhr.responseText);
            const imageUrl = `/uploads/${response.Name}`;
            const img = new Image();
            img.src = imageUrl;

            while (!img.complete) {
                await sleep(100);
            }
            await sleep(100);

            uploadedImage.style.display = "block";
            uploadedImage.width = img.naturalWidth;
            uploadedImage.height = img.naturalHeight;

            const ctx = uploadedImage.getContext('2d');
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
            headerImg.style.display = "none";
            imageContainer.style.display = "grid";
            header.innerText = "Confirm or Upload New"
            okBtn.style.display = "block";
            cropBtn.style.display = "none";
            horBtn.style.display = "none";
            vertBtn.style.display = "none";
        };

        xhr.send(formData);

    });

    shutdownBtn.addEventListener("click", async () => {
        header.innerText = "Shutting down"
        await fetch("/shutdown")
    });

    function calculateAspectRatio(width, height) {
        let landscape;
        let portrait;
        switch (panel) {
            case 'epd7in3f':
                landscape = 800 / 480;
                portrait = 480 / 800;
                break;

            case 'epd4in0e':
                landscape = 600 / 400;
                portrait = 400 / 600;
                break;

        }
        if (width > height) {
            return landscape;
        } else if (height > width) {
            return portrait;
        } else {
            return 1; // Square
        }
    }

    async function startCropper() {
        await sleep(50);

        const aspectRatio = calculateAspectRatio(uploadedImage.width, uploadedImage.height);

        if (cropper) { cropper.destroy() };
        cropper = new Cropper(uploadedImage, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            zoomable: true,
            zoomOnWheel: false
        });
    }

    function changeBr() {
        tempCanvas.width = oldCanvas.width;
        tempCanvas.height = oldCanvas.height;

        const oldCtx = tempCanvas.getContext('2d');
        oldCtx.drawImage(oldCanvas, 0, 0, oldCanvas.width, oldCanvas.height);

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.filter = "brightness(" + currBr + "%)";
        tempCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        const ctx = uploadedImage.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0, uploadedImage.width, uploadedImage.height);
        startCropper();
    }

    brUpBtn.addEventListener("click", () => {
        currBr += 10;

        changeBr()
    })

    brDwBtn.addEventListener("click", () => {
        currBr -= 10;
        if (currBr < 0) {
            currBr = 0;
        }

        changeBr()
    })

    brResBtn.addEventListener("click", () => {
        currBr = 100;
        const ctx = uploadedImage.getContext('2d');
        ctx.drawImage(oldCanvas, 0, 0, uploadedImage.width, uploadedImage.height);
        startCropper();
    })

    function changeSat() {
        tempCanvas.width = oldCanvas.width;
        tempCanvas.height = oldCanvas.height;

        const oldCtx = tempCanvas.getContext('2d');
        oldCtx.drawImage(oldCanvas, 0, 0, oldCanvas.width, oldCanvas.height);

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.filter = "saturate(" + currSat + "%)";
        tempCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

        const ctx = uploadedImage.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0, uploadedImage.width, uploadedImage.height);
        startCropper();
    }

    satUpBtn.addEventListener("click", () => {
        currSat += 10;

        changeSat()
    })

    satDwBtn.addEventListener("click", () => {
        currSat -= 10;
        if (currSat < 0) {
            currSat = 0;
        }

        changeSat()
    })

    satResBtn.addEventListener("click", () => {
        currSat = 100;
        const ctx = uploadedImage.getContext('2d');
        ctx.drawImage(oldCanvas, 0, 0, uploadedImage.width, uploadedImage.height);
        startCropper();
    })


    okBtn.addEventListener("click", () => {
        progressBar.style.display = "none"
        header.innerText = "Crop and Confirm"
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        const resizedCanvas = resizeCanvas(uploadedImage, MAX_WIDTH, MAX_HEIGHT);

        const img = new Image();
        img.src = resizedCanvas.toDataURL("image/png");

        redraw(img);


        okBtn.style.display = "none";

        brUpBtn.style.display = "block";
        brDwBtn.style.display = "block";
        brResBtn.style.display = "block";

        satUpBtn.style.display = "block";
        satDwBtn.style.display = "block";
        satResBtn.style.display = "block";

        cropBtn.style.display = "block";
        vertBtn.style.display = "block";
        horBtn.style.display = "block";

        function resizeCanvas(canvas, maxWidth, maxHeight) {
            const width = canvas.width;
            const height = canvas.height;
            let newWidth = width;
            let newHeight = height;

            // Calculate the new dimensions while maintaining aspect ratio
            if (width > height && width > maxWidth) {
                newWidth = maxWidth;
                newHeight = (height * maxWidth) / width;
            } else if (height > width && height > maxHeight) {
                newHeight = maxHeight;
                newWidth = (width * maxHeight) / height;
            } else if (width > maxWidth) {
                newWidth = maxWidth;
                newHeight = (height * maxWidth) / width;
            } else if (height > maxHeight) {
                newHeight = maxHeight;
                newWidth = (width * maxHeight) / height;
            }
            // Create a new canvas to draw the resized image
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;

            const ctx = resizedCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

            return resizedCanvas;
        };

        function redraw(img) {
            waitForData(img);
            async function waitForData(img) {
                while (!img.complete) {
                    await sleep(100);
                }
                await sleep(100);
                uploadedImage.width = img.naturalWidth;
                uploadedImage.height = img.naturalHeight;
                oldCanvas.width = img.naturalWidth;
                oldCanvas.height = img.naturalHeight;
                const oldCtx = oldCanvas.getContext('2d');
                oldCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

                const ctx = uploadedImage.getContext('2d');
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

                startCropper();

            }
        }
    })

    vertBtn.addEventListener("click", () => {
        const aspectRatio = calculateAspectRatio(uploadedImage.height, uploadedImage.width);

        if (cropper) { cropper.destroy() };
        cropper = new Cropper(uploadedImage, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            zoomable: true,
            zoomOnWheel: false
        });

    })

    horBtn.addEventListener("click", () => {
        const aspectRatio = calculateAspectRatio(uploadedImage.width, uploadedImage.height);

        if (cropper) { cropper.destroy() };
        cropper = new Cropper(uploadedImage, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            zoomable: true,
            zoomOnWheel: false
        });
    })



    cropBtn.addEventListener("click", async () => {
        header.innerText = "Setting New Picture..."
        const croppedCanvas = cropper.getCroppedCanvas();
        cropper.destroy();
        if (croppedCanvas) {
            croppedCanvas.toBlob(sendData, "image/png");

            async function sendData(blob) {
                const croppedImage = blob;
                uploadedImage.style.width = "75%";
                uploadedImage.style.marginLeft = " auto";
                uploadedImage.style.marginRight = " auto";
                uploadedImage.src = croppedImage;

                okBtn.style.display = "none";

                brUpBtn.style.display = "none";
                brDwBtn.style.display = "none";
                brResBtn.style.display = "none";

                satUpBtn.style.display = "none";
                satDwBtn.style.display = "none";
                satResBtn.style.display = "none";

                uploadBtn.style.display = "none";
                cropBtn.style.display = "none";
                horBtn.style.display = "none";
                vertBtn.style.display = "none";
                shutdownBtn.style.display = "none";

                const formData = new FormData();
                formData.append("cropped_image_data", croppedImage, 'cropped_image_data');

                await fetch("/converted", {
                    method: "POST",
                    body: formData,
                });

                await subscribe();

                async function subscribe() {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const response = await fetch("/done");

                    if (response.status == 502) {
                        // Status 502 is a connection timeout error,
                        // may happen when the connection was pending for too long,
                        // and the remote server or a proxy closed it
                        // let's reconnect
                        await subscribe();
                    } else if (response.status != 200) {
                        // An error - let's show it
                        console.log(response.statusText)
                        // Reconnect in one second
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await subscribe();
                    } else if (response.status == 210) {
                        // Still waiting for panel
                        console.log('Waiting for panel...')
                        // Query again in one second
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await subscribe();
                    } else {
                        // Panel is done, show Popup
                        let message = JSON.parse(await response.text());
                        alert(message.Status);
                        shutdownBtn.style.display = "block";
                        uploadBtn.style.display = "block";
                    }
                }
            }
        }
    }
    );

});

window.addEventListener('beforeunload', function (event) {
    // A message for older browsers, though modern browsers ignore this custom message.
    const confirmationMessage = "Are you sure you want to leave this page?";

    // Setting this property shows the confirmation dialog.
    event.returnValue = confirmationMessage;

    // For modern browsers, return a string to show the default confirmation dialog.
    return confirmationMessage;
});