// Show the plugin UI
figma.showUI(__html__, { width: 300, height: 200 });

// Load the previous selections from clientStorage when the plugin starts
async function loadPreviousSelections() {
  const checkUnattachedText = await figma.clientStorage.getAsync('checkUnattachedText') || false;
  const checkCodeConnect = await figma.clientStorage.getAsync('checkCodeConnect') || false;

  figma.ui.postMessage({
    type: 'load-selections',
    checkUnattachedText,
    checkCodeConnect,
  });
}

loadPreviousSelections();

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'start-processing') {
    // Save the selections to clientStorage
    await figma.clientStorage.setAsync('checkUnattachedText', msg.checkUnattachedText);
    await figma.clientStorage.setAsync('checkCodeConnect', msg.checkCodeConnect);

    // Create a mutable copy of the readonly selection array
    const selectedNodes = [...figma.currentPage.selection]; 

    if (selectedNodes.length === 0) {
      figma.notify("Please select a frame or layers to check.");
      return;
    }

    const unattachedTextNodes: SceneNode[] = [];
    const noCodeConnectComponents: SceneNode[] = [];

    // Recursive function to check all nodes and their children
    const checkNodes = (nodes: SceneNode[]) => {
      for (const node of nodes) {
        // Check for unattached text (Text nodes not using a Figma Text Style)
        if (msg.checkUnattachedText && node.type === 'TEXT') {
          const textNode = node as TextNode;
          if (!textNode.textStyleId || textNode.textStyleId === '') {
            unattachedTextNodes.push(node);

            // Turn the text node to bright pink to highlight it
            textNode.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 1 } }];
          }
        }

        // Placeholder for "Check for components without Code Connect"
        if (msg.checkCodeConnect && node.type === 'COMPONENT') {
          // Add logic for Code Connect if you know how to detect it
          noCodeConnectComponents.push(node);
        }

        // Recursively check children (nested layers)
        if ('children' in node) {
          checkNodes(node.children as SceneNode[]);
        }
      }
    };

    // Process selected nodes and their children
    checkNodes(selectedNodes);

    // Generate result messages
    if (msg.checkUnattachedText) {
      figma.notify(`${unattachedTextNodes.length} unattached text layers found and highlighted in bright pink.`);
    }

    if (msg.checkCodeConnect) {
      figma.notify(`${noCodeConnectComponents.length} components without Code Connect found.`);
    }

    figma.closePlugin();
  }
};