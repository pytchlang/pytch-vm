// pytch-gui.js

$(document).ready(function() {

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Editor interaction

    let ace_editor = ace.edit("editor");

    ace_editor.getSession().setUseWorker(false);
    ace_editor.getSession().setMode("ace/mode/python");
    ace_editor.setValue("import pytch\n"
                        + "from pytch import (\n"
                        + "    Stage,\n"
                        + "    Sprite,\n"
                        + ")\n\n");
    ace_editor.clearSelection();

    let show_code_changed_indicator = (evt => {
        $("#code-change-indicator").show();
    });

    let hide_code_changed_indicator = (evt => {
        $("#code-change-indicator").hide();
    });

    ace_editor.on("change", show_code_changed_indicator);

    let ace_editor_set_code = (code_text => {
        ace_editor.setValue(code_text);
        ace_editor.clearSelection();
        ace_editor.moveCursorTo(0, 0);
    });


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Info tabs (tutorial stdout, errors)

    let make_tab_current_via_evt = (evt => {
        let tab_nub = evt.target.dataset.tab;
        make_tab_current(tab_nub);
    });

    let make_tab_current = (tab_nub => {
        $("#info-panel-tabs p").removeClass("current");
        $("#info-panel-content div.tab-content").removeClass("current");

        $(`#tab-header-${tab_nub}`).addClass("current");
        $(`#tab-pane-${tab_nub}`).addClass("current");
    });

    $("#info-panel-tabs p").click(make_tab_current_via_evt);


    ////////////////////////////////////////////////////////////////////////
    //
    // Contents of stdout pane

    class TextPane {
        constructor(initial_html, tab_nub) {
            this.initial_html = initial_html;
            this.content_elt = document.getElementById(`tab-content-${tab_nub}`);
            this.reset();
        }

        reset() {
            this.content_elt.innerHTML = this.initial_html;
            this.is_placeholder = true;
        }

        append_text(txt) {
            if (this.is_placeholder) {
                this.content_elt.innerText = txt;
                this.is_placeholder = false;
            } else {
                this.content_elt.innerText += txt;
            }
        }
    }

    let stdout_info_pane = new TextPane(
        "<span class=\"info\">Any output from your script will appear here.</span>",
        "stdout");


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Tutorials

    class Tutorial {
        constructor(html) {
            let chapters_elt = document.createElement("div");
            chapters_elt.innerHTML = html;

            this.chapters = (chapters_elt
                             .querySelectorAll("div.tutorial-bundle > div"));
        }

        static async async_create(project_root) {
            let tutorial_url = `${project_root}/tutorial.html`;
            let tutorial_response = await fetch(tutorial_url);
            let tutorial_text = await tutorial_response.text();

            return new Tutorial(tutorial_text);
        }

        chapter(chapter_index) {
            return this.chapters[chapter_index];
        }

        chapter_title(chapter_index) {
            let chapter_content = this.chapter(chapter_index);
            let first_h1 = chapter_content.querySelector("h1");
            if (first_h1 !== null)
                return first_h1.innerHTML;

            let first_h2 = chapter_content.querySelector("h2");
            return first_h2.innerHTML;
        }

        get final_code() {
            let front_matter = this.chapters[0];
            return front_matter.dataset.completeCodeText;
        }

        get n_chapters() {
            return this.chapters.length;
        }
    }

    class TutorialPresentation {
        constructor(tutorial, pane_elt, initial_chapter_index=0) {
            this.tutorial = tutorial;
            this.chapter_elt = pane_elt.querySelector(".chapter-container");
            this.toc_list_elt = pane_elt.querySelector(".ToC .entries");
            this.chapter_index = initial_chapter_index;
            this.populate_toc();
            this.refresh();
        }

        populate_toc() {
            this.toc_list_elt.innerHTML = "";
            this.tutorial.chapters.forEach((ch, i) => {
                let toc_entry_elt = document.createElement("li");
                toc_entry_elt.setAttribute("data-chapter-index", i);
                toc_entry_elt.innerHTML = this.tutorial.chapter_title(i);
                $(toc_entry_elt).click((evt) => this.leap_to_chapter_from_event(evt));
                this.toc_list_elt.appendChild(toc_entry_elt);
            });
        }

        leap_to_chapter_from_event(evt) {
            let evt_data = evt.target.dataset;
            this.leap_to_chapter(+evt_data.chapterIndex);
        }

        leap_to_chapter(chapter_index) {
            this.chapter_index = chapter_index;
            this.refresh();
        }

        refresh() {
            this.chapter_elt.innerHTML = "";
            this.chapter_elt.appendChild(this.tutorial.chapter(this.chapter_index));

            if (this.chapter_index == 0)
                this.maybe_augment_front_matter();
            else
                this.maybe_augment_patch_divs();

            this.chapter_elt.scrollTop = 0;

            $(this.toc_list_elt).find("li").removeClass("shown");
            $($(this.toc_list_elt).find("li")[this.chapter_index]).addClass("shown");
        }

        run_final_project() {
            ace_editor.setValue(this.tutorial.final_code);
            ace_editor.clearSelection();
            build_button.visibly_build(true);
        }

        augment_with_navigation(content_elt) {
            let nav_buttons_elt = document.createElement("div");
            $(nav_buttons_elt).addClass("navigation-buttons");

            let on_first_chapter = (this.chapter_index == 0);
            if (! on_first_chapter) {
                let prev_elt = document.createElement("p");
                $(prev_elt).addClass("navigation nav-prev");
                prev_elt.innerHTML = `[back]`;
                $(prev_elt).click(() => this.prev_chapter());
                nav_buttons_elt.appendChild(prev_elt);
            }

            let on_last_chapter = (this.chapter_index == this.tutorial.n_chapters - 1);
            if (! on_last_chapter) {
                let next_elt = document.createElement("p");
                $(next_elt).addClass("navigation nav-next");
                let next_title = this.tutorial.chapter_title(this.chapter_index + 1);
                let next_intro = (this.chapter_index == 0 ? "Let's begin" : "Next");
                next_elt.innerHTML = `${next_intro}: ${next_title}`;
                $(next_elt).click(() => this.next_chapter());
                nav_buttons_elt.appendChild(next_elt);
            }

            content_elt.appendChild(nav_buttons_elt);
        }

        maybe_augment_front_matter() {
            let content_elt = this.chapter_elt.querySelector("div.front-matter");

            if ($(content_elt).hasClass("augmented"))
                return;

            let run_div = content_elt.querySelector("div.run-finished-project");
            if (run_div !== null) {
                let buttons_p = document.createElement("p");
                buttons_p.innerHTML = "Try the project!";
                // Bit of a cheat to re-use 'next page' styling:
                $(buttons_p).addClass("navigation nav-next");
                $(buttons_p).click(() => this.run_final_project());
                run_div.appendChild(buttons_p);
            }

            this.augment_with_navigation(content_elt);

            $(content_elt).addClass("augmented")
        }

        maybe_augment_patch_divs() {
            let content_elt = this.chapter_elt.querySelector("div.chapter-content");

            if ($(content_elt).hasClass("augmented"))
                return;

            let patch_containers = (content_elt
                                    .querySelectorAll("div.patch-container"));

            patch_containers.forEach(div => {
                let patch_div = div.querySelector("div.patch");
                let header_div = document.createElement("h1");
                header_div.innerHTML = "Change the code like this:";
                $(header_div).addClass("decoration");
                div.insertBefore(header_div, patch_div);

                let tbody_add_elts = (patch_div
                                      .querySelectorAll("table > tbody.diff-add"));

                tbody_add_elts.forEach(tbody => {
                    let top_right_td = tbody.querySelector("tr > td:last-child");
                    let copy_div = document.createElement("div");
                    copy_div.innerHTML="<p>COPY</p>";
                    $(copy_div).addClass("copy-button");
                    $(copy_div).click(() => this.copy_added_content(tbody, copy_div));
                    top_right_td.appendChild(copy_div);
                });
            });

            this.augment_with_navigation(content_elt);

            $(content_elt).addClass("augmented");
        }

        async copy_added_content(tbody_elt, copy_button_elt) {
            await navigator.clipboard.writeText(tbody_elt.dataset.addedText);
        }

        next_chapter() {
            this.chapter_index += 1;
            this.refresh();
        }

        prev_chapter() {
            this.chapter_index -= 1;
            this.refresh();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Populate 'Examples' drop-down menu

    (() => {
        let examples_menu_contents = $('#jq-dropdown-examples > ul');

        let examples = [
            {label: 'Moving Ball', url: 'examples/moving_ball.py'},
            {label: 'Pong', url: 'examples/pong.py'},
            {label: 'Balloon Pop', url: 'examples/balloon_pop.py'},
        ];

        let menubar = $("#editor-menubar");

        let load_example = (async evt => {
            menubar.jqDropdown("hide");

            let evt_data = evt.target.dataset;
            let code_url = evt_data.pytchUrl;
            let code_response = await fetch(code_url);
            let code_text = await code_response.text();
            ace_editor_set_code(code_text);

            let user_project_name = `My ${evt_data.pytchLabel}`;
            user_projects.set_project_name(user_project_name);
        });

        examples.forEach(example => {
            let label_elt = $("<label"
                              + ` data-pytch-url="${example.url}"`
                              + ` data-pytch-label="${example.label}">`
                              + example.label
                              + "</label>");
            $(label_elt).click(load_example);
            let li_elt = $("<li></li>");
            li_elt.append(label_elt);
            examples_menu_contents.append(li_elt);
        });
    })();


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
    // Provide 'mouse' interface via browser mouse

    const browser_mouse = (() => {
        const canvas_elt = stage_canvas.dom_elt;
        const stage_hwd = (canvas_elt.width / 2) | 0;
        const stage_hht = (canvas_elt.height / 2) | 0;

        let undrained_clicks = [];
        let client_x = 0.0;
        let client_y = 0.0;

        const on_mouse_move = (evt => {
            client_x = evt.clientX;
            client_y = evt.clientY;
        });

        const current_stage_coords = (() => {
            let elt_rect = canvas_elt.getBoundingClientRect();
            let canvas_x0 = elt_rect.left;
            let canvas_y0 = elt_rect.top;

            let canvas_x = client_x - canvas_x0;
            let canvas_y = client_y - canvas_y0;

            // Recover stage coords by: translating; flipping y.
            let stage_x = canvas_x - stage_hwd;
            let stage_y = stage_hht - canvas_y;

            return { stage_x, stage_y };
        });

        const on_mouse_down = (evt => {
            undrained_clicks.push(current_stage_coords());
        });

        const drain_new_click_events = (() => {
            let evts = undrained_clicks;
            undrained_clicks = [];
            return evts;
        });

        return {
            on_mouse_move,
            on_mouse_down,
            drain_new_click_events,
        };
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Provide 'asynchronous load image' interface

    const async_load_image = (url =>
        new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = (() => resolve(img));
            img.onerror = (ignored_error_event => {
                // TODO: Can we tell WHY we couldn't load that image?
                let error_message = `could not load image "${url}"`;
                let py_error = new Sk.builtin.RuntimeError(error_message);
                reject(py_error);
            });
            img.src = url;
        }));


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Sound, SoundPerformance, SoundManager

    class BrowserSoundPerformance {
        constructor(sound) {
            this.tag = sound.tag;
            this.buffer_source = sound.create_buffer_source();

            this.has_ended = false;
            this.buffer_source.onended = () => { this.has_ended = true; };

            this.buffer_source.start();
        }

        stop() {
            this.buffer_source.stop();
            this.has_ended = true;
        }
    }

    class BrowserSound {
        constructor(parent_sound_manager, tag, audio_buffer) {
            this.parent_sound_manager = parent_sound_manager;
            this.tag = tag;
            this.audio_buffer = audio_buffer;
        }

        launch_new_performance() {
            let sound_manager = this.parent_sound_manager;

            let buffer_source = sound_manager.create_buffer_source();
            let performance = new BrowserSoundPerformance(this);
            sound_manager.register_running_performance(performance);

            return performance;
        }

        create_buffer_source() {
            let sound_manager = this.parent_sound_manager;
            let buffer_source = sound_manager.create_buffer_source();
            buffer_source.buffer = this.audio_buffer;
            return buffer_source;
        }
    }

    class BrowserSoundManager {
        constructor() {
            let AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audio_context = new AudioContext();
            this.running_performances = [];
        }

        async async_load_sound(tag, url) {
            let response = await fetch(url);
            let raw_data = await response.arrayBuffer();
            let audio_buffer = await this.audio_context.decodeAudioData(raw_data);
            return new BrowserSound(this, tag, audio_buffer);
        }

        register_running_performance(performance) {
            this.running_performances.push(performance);
        }

        stop_all_performances() {
            this.running_performances.forEach(p => p.stop());
            this.running_performances = [];
        }

        one_frame() {
            this.running_performances
                = this.running_performances.filter(p => (! p.has_ended));
        }

        create_buffer_source() {
            let buffer_source = this.audio_context.createBufferSource();
            buffer_source.connect(this.audio_context.destination);
            return buffer_source;
        }
    }

    // Chrome (and possibly other browsers) won't let you create a running
    // AudioContext unless you're doing so in response to a user gesture.  We
    // therefore defer creation and connection of the global Skulpt/Pytch sound
    // manager until first 'BUILD'.  The default Pytch sound-manager has a
    // 'do-nothing' implementation of one_frame(), so we can safely call it in
    // the main per-frame function below.

    let browser_sound_manager = null;

    let ensure_sound_manager = () => {
        if (browser_sound_manager === null) {
            browser_sound_manager = new BrowserSoundManager();
            Sk.pytch.sound_manager = browser_sound_manager;
        }
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Report errors

    let errors_info_pane = (() => {
        let explanation_p = document.getElementById("exceptions-explanation");
        let container_div = document.getElementById("exceptions-container");

        // What 'context', if any, are we currently showing the rich list of
        // errors for?  If none (represented as null), we are showing the
        // explanatory text saying that any errors would appear in that tab.
        let have_error_list_for_context = null;

        // Throw away any previous errors and ensure we are showing the
        // explanation for the tab instead.
        const reset = () => {
            explanation_p.innerHTML = "Any errors in your code will appear here.";
            $(explanation_p).show();

            container_div.innerHTML = "";
            $(container_div).hide();

            have_error_list_for_context = null;
        };

        const error_intro_nub_for_context = (context) => {
            switch (context) {
            case "build":
                return "could not be built";
            case "run":
                return "has stopped";
            default:
                throw Error(`unknown error context ${context}`);
            }
        };

        // Make sure we are showing the <div> containing the rich error reports
        // rather than the explanatory para.  If are already showing the error
        // list, do nothing because there will already be errors there.
        const ensure_have_error_list = (context) => {
            // Have we already set the error-info pane up?  We only want to do
            // so once.
            if (have_error_list_for_context !== null) {
                // If we have already set it up, it should be for the same
                // context (build or run) as we're now being asked for.
                if (have_error_list_for_context !== context)
                    throw Error("already have error info for "
                                + have_error_list_for_context
                                + " but was asked to set one up for "
                                + context);

                return;
            }

            $(explanation_p).hide();

            let intro_div = document.createElement("div");
            let intro_nub = error_intro_nub_for_context(context);
            intro_div.innerHTML = (
                (`<p class=\"errors-intro\">Your project ${intro_nub} because:</p>`
                 + "<ul></ul>"));

            container_div.innerHTML = "";
            container_div.appendChild(intro_div);
            $(container_div).show();

            have_error_list_for_context = context;
        };

        const append_err_li_text = (ul, text) => {
            let li = document.createElement("li");
            li.innerText = text;
            ul.appendChild(li);
            return li;
        };

        const append_err_li_html = (ul, html) => {
            let li = document.createElement("li");
            li.innerHTML = html;
            ul.appendChild(li);
            return li;
        };

        const simple_exception_str = (err => {
            let simple_str = err.tp$name;
            if (err.args && err.args.v.length > 0)
                simple_str += ": " + err.args.v[0].v;
            return simple_str;
        });

        const punch_in_lineno_span = (parent_elt, lineno) => {
            let span = document.createElement("span");
            span.innerText = `line ${lineno}`;
            $(span).addClass("error-loc");

            let old_span = parent_elt.querySelector("span");
            parent_elt.replaceChild(span, old_span);
        };

        const append_error = (err, thread_info) => {
            let context = (thread_info === null ? "build" : "run");
            ensure_have_error_list(context);

            let err_li = document.createElement("li");
            $(err_li).addClass("one-error");
            err_li.innerHTML = ("<p class=\"intro\"></p>"
                                + "<ul class=\"err-traceback\"></ul>"
                                + "<p>had this problem:</p>"
                                + "<ul class=\"err-message\"></ul>");

            let msg = ((err instanceof Error)
                       ? `Error: ${err.message}`
                       : simple_exception_str(err));

            switch (context) {
            case "build": {
                let n_traceback_frames = err.traceback.length;
                if (n_traceback_frames != 1)
                    throw Error("expecting single-frame traceback for build error"
                                + ` but got ${n_traceback_frame}-frame one`);
                let frame = err.traceback[0];

                err_li.querySelector("p.intro").innerHTML = "Your code";

                let err_message_ul = err_li.querySelector("ul.err-message");
                append_err_li_text(err_message_ul, msg);

                let err_traceback_ul = err_li.querySelector("ul.err-traceback");
                let frame_li = append_err_li_html(err_traceback_ul, "at <span></span>");
                punch_in_lineno_span(frame_li, frame.lineno);

                let errors_ul = container_div.querySelector("ul");
                errors_ul.append(err_li);

                break;
            }
            case "run": {

                err_li.querySelector("p.intro").innerHTML
                    = (`A <i>${thread_info.target_class_kind}</i>`
                       + ` of class <i>${thread_info.target_class_name}</i>`);

                let err_traceback_ul = err_li.querySelector("ul.err-traceback");
                err.traceback.forEach((frame, idx) => {
                    let intro = (idx > 0) ? "called by" : "at";
                    let frame_li = append_err_li_html(
                        err_traceback_ul, `${intro} <span></span> of your code`);
                    punch_in_lineno_span(frame_li, frame.lineno);
                });

                append_err_li_html(err_traceback_ul,
                                   `in the method <code>${thread_info.callable_name}</code>`);
                append_err_li_html(err_traceback_ul,
                                   `running because of <code>${thread_info.event_label}</code>`);

                let err_message_ul = err_li.querySelector("ul.err-message");
                append_err_li_text(err_message_ul, msg);

                let errors_ul = container_div.querySelector("ul");
                errors_ul.append(err_li);

                break;
            }

            default:
                throw Error(`unknown error context ${context}`);
            }
        };

        return {
            append_error,
            reset,
        };
    })();

    let report_uncaught_exception = (e, thread_info) => {
        errors_info_pane.append_error(e, thread_info);
        make_tab_current("stderr");
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Build user code

    const build_button =
    (() => {
        const button = $("#build-button");

        const enable = () => {
            (button
             .html("<p>BUILD</p>")
             .removeClass("greyed-out")
             .click(() => visibly_build(false)));
        };

        const disable = () => {
            (button
             .html("<p><i>Working...</i></p>")
             .addClass("greyed-out")
             .off("click"));
        };

        const build = async (then_green_flag) => {
            let code_text = ace_editor.getValue();
            try {
                await Sk.pytchsupport.import_with_auto_configure(code_text);
            } catch (err) {
                report_uncaught_exception(err, null);
            }

            if (then_green_flag)
                Sk.pytch.current_live_project.on_green_flag_clicked();

            stage_canvas.dom_elt.focus();
            enable();
        };

        const immediate_feedback = () => {
            disable();
            stdout_info_pane.reset();
            errors_info_pane.reset();
            hide_code_changed_indicator();
        };

        // If the program is very short, it looks like nothing has happened
        // unless we have a short flash of the "Working..." message.  Split the
        // behaviour into immediate / real work portions.
        const visibly_build = (then_green_flag) => {
            ensure_sound_manager();
            immediate_feedback();
            window.setTimeout(() => build(then_green_flag), 125);
        };

        enable();

        return {
            visibly_build,
        };
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Local storage for projects

    let user_projects = (() => {
        let local_storage_key = "pytch-saved-projects";
        let menubar = $("#editor-menubar");
        let user_projects_menu_header = $("#user-projects-menu-header");
        let user_projects_contents = $("#jq-dropdown-user-projects > ul");
        let user_project_name_input = $("#user-chosen-project-name");
        let save_my_project_button = $("#save-my-project-button");

        let saved_project_data = (() => {
            let json_saved_projects = window.localStorage.getItem(local_storage_key);
            return ((json_saved_projects === null)
                    ? []
                    : JSON.parse(json_saved_projects));
        });

        let persist_saved_projects = (project_descriptors => {
            window.localStorage.setItem(local_storage_key,
                                        JSON.stringify(project_descriptors));
        });

        let maybe_project_by_name = ((projects, target_name) => {
            let tgt_idx = projects.findIndex(proj => (proj.name === target_name));

            let next_tgt_idx = projects.findIndex(
                (proj, idx) => ((idx > tgt_idx) && (proj.name === target_name)));

            if (next_tgt_idx !== -1)
                // TODO: More useful error-reporting, even though this is an
                // internal error.
                throw Error(`found "${target_name}" more than once`);

            return (tgt_idx === -1) ? null : projects[tgt_idx];
        });

        let save_project = (() => {
            // TODO: Prompt for confirmation of overwriting if different name
            // to last loaded/saved.

            let project_name = user_project_name_input.val();
            let saved_projects = saved_project_data();
            let project_code_text = ace_editor.getValue();

            let maybe_existing_project
                = maybe_project_by_name(saved_projects, project_name);

            if (maybe_existing_project !== null) {
                let existing_project = maybe_existing_project;
                existing_project.code_text = project_code_text;
            } else {
                saved_projects.push({ name: project_name,
                                      code_text: project_code_text });
            }

            persist_saved_projects(saved_projects);
            refresh();
        });

        let load_project = (evt => {
            menubar.jqDropdown("hide");

            let all_projects = saved_project_data();
            let project_idx = +(evt.target.parentNode.dataset.pytchEntryIdx);
            let project = all_projects[project_idx];
            ace_editor_set_code(project.code_text);
        });

        let highlight_to_be_deleted_project = (evt => {
            let entry_label = $(evt.target.parentNode).find("label");
            entry_label.addClass("cued-for-delete");
        });

        let unhighlight_to_be_deleted_project = (evt => {
            let entry_label = $(evt.target.parentNode).find("label");
            entry_label.removeClass("cued-for-delete");
        });

        let delete_saved_project = (evt => {
            menubar.jqDropdown("hide");
            evt.stopPropagation();

            let all_projects = saved_project_data();
            let project_idx = +(evt.target.parentNode.dataset.pytchEntryIdx);
            all_projects.splice(project_idx, 1);
            persist_saved_projects(all_projects);

            refresh();
        });

        let refresh = (() => {
            user_projects_contents.empty();

            let all_projects = saved_project_data();
            all_projects.forEach((project_descriptor, entry_idx) => {
                let name = project_descriptor.name;

                let li_elt = $("<li></li>");
                li_elt.attr("data-pytch-entry-idx", entry_idx);

                let label_elt = $("<label></label>");
                label_elt.text(name);  // Ensure special chars are escaped.
                label_elt.click(load_project);
                li_elt.append(label_elt);

                let delete_elt = $("<span class=\"delete-button\">DELETE</span>");
                $(delete_elt).click(delete_saved_project);
                $(delete_elt).hover(highlight_to_be_deleted_project,
                                    unhighlight_to_be_deleted_project);
                li_elt.append(delete_elt);

                user_projects_contents.append(li_elt);
            });

            user_projects_menu_header.toggleClass("greyed-out jq-dropdown-ignore",
                                                  (all_projects.length == 0));
        });

        let set_project_name = (name => {
            user_project_name_input.val(name);
        });

        refresh();
        save_my_project_button.click(save_project);

        return {
            set_project_name,
        };
    })();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Connect Skulpt to our various interfaces

    Sk.configure({
        read: builtinRead,
        output: (txt => stdout_info_pane.append_text(txt)),
        pytch: {
            async_load_image: async_load_image,
            keyboard: browser_keyboard,
            mouse: browser_mouse,
            on_exception: report_uncaught_exception,
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

    stage_canvas.dom_elt.onmousemove = browser_mouse.on_mouse_move;
    stage_canvas.dom_elt.onmousedown = browser_mouse.on_mouse_down;


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Define and launch perpetual Pytch loop

    const one_frame = function() {
        let project = Sk.pytch.current_live_project;

        Sk.pytch.sound_manager.one_frame();
        project.one_frame();
        stage_canvas.render(project);

        window.requestAnimationFrame(one_frame);
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Load example tutorial

    let running_tutorial_presentation = null;

    const launch_tutorial = async (project_root) => {
        let tutorial = await Tutorial.async_create(project_root);

        // TODO: When to change this back again?
        Sk.pytch.project_root = project_root;

        running_tutorial_presentation
            = new TutorialPresentation(tutorial,
                                       $("#tab-pane-tutorial")[0]);
    };

    launch_tutorial("tutorials/bunner").then(
        () => window.requestAnimationFrame(one_frame));
});
