const fs = require('fs');
const file = './src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const routerLogic = `
  const navigateTo = React.useCallback((screen, sheetStateOverride = 'hidden', replace = false) => {
    let path = '/';
    if (screen === 'contact') path = '/contact';
    if (screen === 'terms') path = '/terms';
    if (screen === 'refund') path = '/refund-policy';
    if (screen === 'privacy-policy') path = '/privacy-policy';
    if (screen === 'login') path = '/login';
    if (screen === 'home') path = '/app';
    if (screen === 'landing') path = '/';

    const newState = { screen, sheetState: sheetStateOverride };
    if (replace) {
      window.history.replaceState(newState, '', path);
    } else {
      window.history.pushState(newState, '', path);
    }
    setActiveScreen(screen);
    if (sheetStateOverride && sheetStateOverride !== 'keep') {
        setSheetState(sheetStateOverride);
    }
  }, []);

  const goBack = React.useCallback(() => {
    window.history.back();
  }, []);
`;

if (!content.includes('const navigateTo = React.useCallback')) {
    content = content.replace("const [activeScreen, setActiveScreen] = useState(getInitialScreen);", "const [activeScreen, setActiveScreen] = useState(getInitialScreen);\n" + routerLogic);
}

// Remove old navigateTo and goBack implementations near line 630
const navigateRegex = /const navigateTo = \(screen, sheetStateOverride = 'hidden', replace = false\) => \{[\s\S]*?setSheetState\(sheetStateOverride\);\n  \};/g;
content = content.replace(navigateRegex, '// navigateTo hoisted');

const goBackRegex = /const goBack = \(\) => \{\n    window\.history\.back\(\);\n  \};/g;
content = content.replace(goBackRegex, '// goBack hoisted');

// Replace scattered `setActiveScreen` with `navigateTo`
content = content.replace(/setActiveScreen\('login'\)/g, "navigateTo('login', 'hidden')");
content = content.replace(/setActiveScreen\('home'\)/g, "navigateTo('home', 'collapsed')");

// Special case: `setActiveScreen((prev) => prev === 'landing' ? 'home' : prev);` on line 152
content = content.replace(/setActiveScreen\(\(prev\) => prev === 'landing' \? 'home' : prev\);/g, "if (activeScreen === 'landing') { navigateTo('home', 'collapsed', true); }");

// Restore `setActiveScreen('home')` specifically inside the popstate handle (around line 621) 
// if it previously got replaced by navigateTo
const popstateReplacement = `
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.screen) {
        setActiveScreen(state.screen);
        if (state.sheetState) {
          setSheetState(state.sheetState);
        }
      } else {
        setActiveScreen('home');
        setSheetState('collapsed');
      }
    };`;
content = content.replace(/navigateTo\('home', 'collapsed'\);\n        setSheetState\('collapsed'\);/g, "setActiveScreen('home');\n        setSheetState('collapsed');");

fs.writeFileSync(file, content, 'utf8');
console.log('Router patched successfully.');
