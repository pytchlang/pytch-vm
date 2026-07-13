"use strict";

const {
    configure_mocha,
    assert,
    import_deindented,
    broadcast_and_step,
    pytch_stdout,
    property_set_mechanism_specs,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Position querying via properties

describe("Position properties", () => {
    property_set_mechanism_specs.forEach(spec =>
        it(`can retrieve coords (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Costumes = ["yellow-banana.png"]

                    @pytch.when_I_receive("move")
                    def move_around(self):
                        self.go_to_xy(10, 20)
                        print(f"{self.x_position} {self.y_position}")
                        self.set_x(100)
                        print(f"{self.x_position} {self.y_position}")
                        self.set_y(-40)
                        print(f"{self.x_position} {self.y_position}")
                        self.change_x(10)
                        print(f"{self.x_position} {self.y_position}")
                        self.change_y(-30)
                        print(f"{self.x_position} {self.y_position}")

                    @pytch.when_I_receive("move-prop")
                    def move_around_prop(self):
                        self.go_to_xy(10, 20)
                        print(f"{self.x_position} {self.y_position}")
                        self.x_position = 100
                        print(f"{self.x_position} {self.y_position}")
                        self.y_position = -40
                        print(f"{self.x_position} {self.y_position}")
                        self.x_position += 10
                        print(f"{self.x_position} {self.y_position}")
                        self.y_position -= 30
                        print(f"{self.x_position} {self.y_position}")
            `);

            broadcast_and_step(project, `move${spec.message_suffix}`);

            const exp_output = [
                "10 20\n",
                "100 20\n",
                "100 -40\n",
                "110 -40\n",
                "110 -70\n"
            ].join("")

            assert.equal(pytch_stdout.drain_stdout(), exp_output);
    }));

    it("can retrieve size", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
                @pytch.when_I_receive("grow-and-shrink")
                def grow_and_shrink(self):
                    self.set_size(0.5)
                    print(f"{self.size}")
                    self.set_size(2.5)
                    print(f"{self.size}")
                    self.set_size(0.875)
                    print(f"{self.size}")
        `);

        broadcast_and_step(project, "grow-and-shrink");

        const exp_output = "0.5\n2.5\n0.875\n"
        assert.equal(pytch_stdout.drain_stdout(), exp_output);
    });
});
