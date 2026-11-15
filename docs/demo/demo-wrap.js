/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2025, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */

document.getElementById("demo-info").innerHTML = `
 A treegrid with rows of variable height (<code>autoRowHeight</code>):
 Long text is wrapped in columns that have the <code>wrap</code> option set.
 Try to resize the columns or edit a title (<kbd>F2</kbd>).
`;

(function () {
  const WORDS = (
    "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
    "tempor incididunt ut labore et dolore magna aliqua"
  ).split(" ");

  // Generate reproducible sample text of different length
  function makeText(seed, maxWords) {
    const count = 1 + ((seed * 7919) % maxWords);
    const res = [];
    for (let i = 0; i < count; i++) {
      res.push(WORDS[(seed * 31 + i * 17) % WORDS.length]);
    }
    const text = res.join(" ");
    return text[0].toUpperCase() + text.slice(1) + ".";
  }

  function makeSource(folderCount, childCount) {
    const source = [];
    let seed = 1;
    for (let i = 1; i <= folderCount; i++) {
      const children = [];
      for (let j = 1; j <= childCount; j++) {
        seed++;
        children.push({
          title: `Task ${i}.${j}: ${makeText(seed, 6)}`,
          state: ["open", "in progress", "done"][seed % 3],
          description: makeText(seed + 3, 40),
        });
      }
      source.push({
        title: `Project ${i}`,
        type: "folder",
        expanded: i <= 2,
        description: makeText(i, 12),
        children: children,
      });
    }
    return source;
  }

  new mar10.Wunderbaum({
    id: "demo",
    element: document.getElementById("demo-tree"),
    source: makeSource(500, 20),
    debugLevel: 5,
    connectTopBreadcrumb: "output#parentPath",
    // Rows grow with their content:
    autoRowHeight: true,
    columnsResizable: true,
    columns: [
      { id: "*", title: "Task", width: "250px", wrap: true },
      { id: "state", title: "State", width: "90px" },
      { id: "description", title: "Description", width: "*", wrap: true },
    ],
    edit: {
      trigger: ["clickActive", "F2", "macEnter"],
      select: true,
    },
    filter: {
      mode: "hide",
      autoExpand: true,
      connect: {
        inputElem: "#filter-query",
        nextButton: "#filter-next",
        prevButton: "#filter-prev",
        matchInfoElem: "#filter-match-info",
      },
    },
    dnd: {
      dragStart: (e) => {
        e.event.dataTransfer.effectAllowed = "all";
        return true;
      },
      dragEnter: (e) => {
        return e.node.type === "folder" ? "over" : ["before", "after"];
      },
      drop: (e) => {
        e.sourceNode.moveTo(e.node, e.suggestedDropMode);
      },
    },
    render: function (e) {
      for (const col of Object.values(e.renderColInfosById)) {
        // Assumption: we named column.id === node.data.NAME
        col.elem.textContent = e.node.data[col.id] ?? "";
      }
    },
  });
})();
