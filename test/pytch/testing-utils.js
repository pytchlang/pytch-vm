"use strict";


////////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const reqskulpt = require("../../support/run/require-skulpt").requireSkulpt;

before(() => {
    // Inject 'Sk' object into global namespace.
    reqskulpt(false);

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Test helpers

    global.assert = require("assert");
});

