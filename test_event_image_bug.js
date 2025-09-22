/*
Test Case: Event Image Upload Bug Reproduction
Description: This test reproduces the bug where adding an image to an event 
loses the already entered form fields.

Expected behavior:
1. Fill out event form fields
2. Upload an image
3. Form fields should remain intact
4. Event should be created WITH the image

Actual bug:
1. Fill out event form fields  
2. Upload an image
3. Form fields are lost
4. Event is created WITHOUT the image

Investigation points:
- Check if setEditingEvent is properly preserving state
- Verify ImageCropTool modal doesn't interfere with form state
- Test if the crop tool causes form re-renders that reset state
*/

// This is a test case description file for manual testing
// To reproduce the bug:

// 1. Navigate to Admin Portal (login required)
// 2. Go to Calendar Management tab
// 3. Click "Add Event" button
// 4. Fill in these fields:
//    - Date: Any future date
//    - Time: Any time  
//    - Title: "Test Event with Image"
//    - Type: "Practice"
//    - Location: Any location
//    - Description: "Testing image upload bug"
//
// 5. Upload an event photo:
//    - Click on the image upload area
//    - Select any image file
//    - Observe: Does the ImageCropTool open?
//    - Check: Are the form fields still filled after crop tool opens?
//    - Complete the crop or cancel
//    - Check: Are form fields still intact?
//
// 6. Submit the form
//    - Click save/submit
//    - Verify: Is event created?
//    - Check: Does the event have the image?

console.log(`
EVENT IMAGE UPLOAD BUG TEST CASE
================================

Steps to reproduce:
1. Login as admin
2. Go to Admin Portal > Calendar Management  
3. Click Add Event
4. Fill all form fields (title, date, time, etc.)
5. Upload an image for the event
6. Check if form fields are lost when crop tool opens
7. Save the event
8. Verify if image is saved with event

Expected: Form fields preserved, event created with image
Actual: Form fields lost, event created without image
`);

export default {
    testName: "Event Image Upload Bug",
    description: "Form fields lost when uploading event image",
    severity: "high",
    affectedComponent: "EventForm + FileUploadInput + ImageCropTool",
    reproductionSteps: [
        "Fill event form fields",
        "Upload event image", 
        "Observe form field loss",
        "Submit form",
        "Verify event created without image"
    ],
    expectedResult: "Form fields preserved, event created with image",
    actualResult: "Form fields lost, event created without image",
    potentialCauses: [
        "ImageCropTool modal causing form state reset",
        "FileUploadInput re-rendering issues", 
        "setEditingEvent not properly preserving state",
        "Modal overlay interfering with form focus"
    ]
};