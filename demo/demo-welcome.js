/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-tree").innerHTML = `
<div class="welcome-page">
    <h3>Demo Application</h3>
    <br>
    <ul>
    <li>Select a demo in the navigation tree on the left side.</li>
    <li>Use buttons (<i class="bi bi-list-check"></i>, <i class="bi bi-plus-slash-minus"></i>, etc.) 
        and checkboxes above the demo trees to apply commands.</li>
    <li>Click the <u>View Source Code</u> link below the demo trees to view 
        implementation details.</li>
    <li>The navigation tree on the left of this demo app is also implemented 
        with Wunderbaum. <br>
        Check the 
        <a href="./navigation.js" target="_blank">source code of this demo app</a> 
        for some ideas how to implement GUI controls for the tree.</li>
    </ul>
</div>
`;
