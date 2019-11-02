"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Bounding box computation, collision detection.

describe("collision detection", () => {
    it("can extract bounding boxes", async () => {
        let import_result = await import_local_file("py/project/bounding_boxes.py");
        let project = import_result.$d.project.js_project;
        assert.equal(project.actors.length, 2);

        // Square's centre-x should be at -50; its costume is 80 wide and has a
        // centre of 20.  So 20 sticks out to the left of centre and 60 to the
        // right; so x-extent should be -70 up to 10.  Its centre-y should be at
        // -90; costume is 80 high with 30 above the centre and 50 below; so
        // y-extent should be -140 up to -60.
        let square = project.instance_0_by_class_name("Square");
        assert_has_bbox("Square", square, -70, 10, -140, -60);

        // Likewise for Rectangle:
        let rectangle = project.instance_0_by_class_name("Rectangle");
        assert_has_bbox("Rectangle", rectangle, -40, 20, -110, -80);
    });
});
