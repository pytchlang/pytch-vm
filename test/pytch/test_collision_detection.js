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

    it("can detect two touching sprites depending on their visibility", async () => {
        let import_result = await import_local_file("py/project/bounding_boxes.py");
        let project = import_result.$d.project.js_project;

        let py_square = project.instance_0_by_class_name("Square").py_object;
        let py_rectangle = project.instance_0_by_class_name("Rectangle").py_object;

        [false, true].forEach(show_square => {
            call_method(py_square, "set_visibility", [show_square]);

            [false, true].forEach(show_rectangle => {
                call_method(py_rectangle, "set_visibility", [show_rectangle]);

                let got_touch = project.sprite_instances_are_touching(py_square,
                                                                      py_rectangle);
                let exp_touch = (show_square && show_rectangle);

                assert.strictEqual(got_touch, exp_touch);
            });
        });
    });

    it("can detect two touching sprites depending on their locations", async () => {
        let import_result = await import_local_file("py/project/bounding_boxes.py");
        let project = import_result.$d.project.js_project;

        let py_square = project.instance_0_by_class_name("Square").py_object;
        let py_rectangle = project.instance_0_by_class_name("Rectangle").py_object;

        // Move the Square around and test for hits against stationary
        // Rectangle.  Keeping Square's y constant, it should touch the
        // Rectangle if x is (exclusively) between -100 and 40.
        //
        for (let sq_x = -120; sq_x < 60; sq_x += 1) {
            call_method(py_square, "set_x", [sq_x]);

            let got_touch = project.sprite_instances_are_touching(py_square,
                                                                  py_rectangle);
            let exp_touch = (sq_x > -100) && (sq_x < 40);

            assert.strictEqual(got_touch, exp_touch,
                               "for Square having x of " + sq_x);
        }

        // Keeping Square's x constant at a level where it touches
        // Rectangle, the Square should touch the Rectangle if the
        // Square's y is (exclusively) between -140 and -30.
        //
        call_method(py_square, "set_x", [0]);
        for (let sq_y = -160; sq_y < 10; sq_y += 1) {
            call_method(py_square, "set_y", [sq_y]);

            let got_touch = project.sprite_instances_are_touching(py_square,
                                                                  py_rectangle);
            let exp_touch = (sq_y > -140) && (sq_y < -30);

            assert.strictEqual(got_touch, exp_touch,
                               "for Square having y of " + sq_y);
        }
    });
});
