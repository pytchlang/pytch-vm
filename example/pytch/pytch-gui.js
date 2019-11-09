// pytch-gui.js

$(document).ready(function() {

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Editor interaction

    let ace_editor = ace.edit("editor");

    ace_editor.getSession().setUseWorker(false);
    ace_editor.getSession().setMode("ace/mode/python");


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Skulpt interaction

    let builtinRead = (fname => {
        if (Sk.builtinFiles === undefined
                || Sk.builtinFiles["files"][fname] === undefined)
            throw Error(`File not found: '${fname}'`);

        return Sk.builtinFiles["files"][fname];
    });


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Provide rendering target and source keyboard events via canvas

    const stage_canvas = (() => {
        const dom_elt = $("#pytch-canvas")[0];

        if (! dom_elt.hasAttribute("tabindex"))
            dom_elt.setAttribute("tabindex", 0);

        const stage_width = dom_elt.width;
        const stage_half_width = (stage_width / 2) | 0;
        const stage_height = dom_elt.height;
        const stage_half_height = (stage_height / 2) | 0;

        const canvas_ctx = dom_elt.getContext("2d");

        canvas_ctx.translate(stage_half_width, stage_half_height);
        canvas_ctx.scale(1, -1);

        const enact_instructions = (rendering_instructions => {
            rendering_instructions.forEach(instr => {
                switch(instr.kind) {
                case "RenderImage":
                    canvas_ctx.save();
                    canvas_ctx.translate(instr.x, instr.y);
                    canvas_ctx.scale(instr.scale, -instr.scale);
                    canvas_ctx.drawImage(instr.image, 0, 0);
                    canvas_ctx.restore();
                    break;

                default:
                    throw Error(`unknown render-instruction kind "${instr.kind}"`);
                }
            });
        });

        const render = (project => {
            canvas_ctx.clearRect(-stage_half_width, -stage_half_height,
                                 stage_width, stage_height);
            enact_instructions(project.rendering_instructions());
        });

        return {
            dom_elt,
            render,
        };
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Provide 'keyboard' interface via browser keyboard

    const browser_keyboard = (() => {
        let undrained_keydown_events = [];
        let key_is_down = {};

        const on_key_down = (e => {
            key_is_down[e.key] = true;
            undrained_keydown_events.push(e.key);
            e.preventDefault();
        });

        const on_key_up = (e => {
            key_is_down[e.key] = false;
            e.preventDefault();
        });

        const drain_new_keydown_events = () => {
            let evts = undrained_keydown_events;
            undrained_keydown_events = [];
            return evts;
        };

        const key_is_pressed = (keyname => (key_is_down[keyname] || false));

        return {
            on_key_down,
            on_key_up,
            key_is_pressed,
            drain_new_keydown_events,
        };
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Provide 'asynchronous load image' interface

    const async_load_image = (url =>
        new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = (() => resolve(img));
            img.src = url;
        }));


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Build user code

    (() => {
        const button = $("#build-button");

        const enable = () => {
            (button
             .html("BUILD")
             .removeClass("greyed-out")
             .click(visibly_build));
        };

        const disable = () => {
            (button
             .html("<i>Working...</i>")
             .addClass("greyed-out")
             .off("click"));
        };

        const build = async () => {
            let code_text = ace_editor.getValue();
            await Sk.misceval.asyncToPromise(
                () => Sk.importMainWithBody("<stdin>", false, code_text, true));
            stage_canvas.dom_elt.focus();
            enable();
        };

        const immediate_feedback = () => {
            disable();
        };

        // If the program is very short, it looks like nothing has happened
        // unless we have a short flash of the "Working..."  message.  Split the
        // behaviour into immediate / real work portions.
        const visibly_build = () => {
            immediate_feedback();
            window.setTimeout(build, 125);
        };

        enable();
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Connect Skulpt to our various interfaces

    Sk.configure({
        read: builtinRead,
        pytch: {
            async_load_image: async_load_image,
            keyboard: browser_keyboard,
        },
    });


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Connect browser events to Pytch handlers

    $("#green-flag").click(() => {
        Sk.pytch.current_live_project.on_green_flag_clicked();
        stage_canvas.dom_elt.focus();
    });

    $("#red-stop").click(() => {
        Sk.pytch.current_live_project.on_red_stop_clicked();
        stage_canvas.dom_elt.focus();
    });

    stage_canvas.dom_elt.onkeydown = browser_keyboard.on_key_down;
    stage_canvas.dom_elt.onkeyup = browser_keyboard.on_key_up;


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Define and launch perpetual Pytch loop

    const one_frame = function() {
        let project = Sk.pytch.current_live_project;

        project.one_frame();
        stage_canvas.render(project);

        window.requestAnimationFrame(one_frame);
    };

    window.requestAnimationFrame(one_frame);
});
