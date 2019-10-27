var $builtinmodule = function (name) {
    let mod = {};

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Javascript-level "Project" class

    class Project {
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Python-level "Project" class

    const project_cls = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(self => {
            self.js_project = new Project();
        });
    };

    mod.Project = Sk.misceval.buildClass(mod, project_cls, "Project", []);


    ////////////////////////////////////////////////////////////////////////////////

    return mod;
};
