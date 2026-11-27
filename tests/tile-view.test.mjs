import test from "node:test";
import assert from "node:assert/strict";
import {tileState} from "../apps/web/public/meshwall/tile-view.mjs";
test("tile status never labels connecting or waiting as live",()=>{for(const status of ["Ready","Queued","Connecting / awaiting consent","Connected · waiting for screen","Awaiting agent / consent","Offline","Stopped","Disconnected / denied","No session / no decoded frame","Renderer error — retry"])assert.notEqual(tileState(status)[0],"live");assert.equal(tileState("Live · view only")[0],"live");});
test("session endings remain distinguishable without claiming definite denial",()=>{assert.equal(tileState("Offline")[1],"Offline");assert.equal(tileState("Disconnected / denied")[1],"Ended");assert.equal(tileState("No session / no decoded frame")[1],"No session");assert.equal(tileState("Renderer error — retry")[1],"Error");});
