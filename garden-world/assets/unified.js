/**
 * Unified JavaScript file
 * Determines which functionality to execute based on script tag data attributes
 */

(function () {
  'use strict';

  // Global configuration variable
  var globalConfig = {};

  // Get current script tag
  function getCurrentScript() {
    // Modern browsers support document.currentScript
    if (document.currentScript) {
      return document.currentScript;
    }

    try {
      const stack = new Error().stack;
      if (stack) {
        const currentScriptUrl = extractScriptUrlFromStack(stack);
        if (currentScriptUrl) {
          const scripts = document.getElementsByTagName('script');
          for (let i = scripts.length - 1; i >= 0; i--) {
            const script = scripts[i];
            if (script.src && script.src === currentScriptUrl) {
              return script;
            }
          }
        }
      }
    } catch (e) {
    }

    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const script = scripts[i];
      if (script.src && script.src.includes('unified.js')) {
        return script;
      }
      if (script.hasAttribute('data-set')) {
        return script;
      }
    }
  }

  // Parse data-set attribute (cookie-like format)
  function parseDataSet(dataSetString) {
    var config = {};
    if (!dataSetString) {
      return config;
    }

    // Split by semicolon and parse key=value pairs
    var pairs = dataSetString.split(';');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].trim();
      if (pair) {
        var equalIndex = pair.indexOf('=');
        if (equalIndex > 0) {
          var key = pair.substring(0, equalIndex).trim();
          var value = pair.substring(equalIndex + 1).trim();
          config[key] = value;
        }
      }
    }
    return config;
  }

  // Get script configuration
  function getScriptConfig() {
    var script = getCurrentScript();
    if (!script) {
      console.warn('Unable to get current script tag');
      return {};
    }

    var dataSet = script.getAttribute('data-set');
    var parsedConfig = parseDataSet(dataSet);

    return {
      mode: parsedConfig.mode || script.getAttribute('data-mode'), // watermark | fab
      language: parsedConfig.lang || parsedConfig.language || script.getAttribute('data-language'), // en | zh (support both 'lang' and 'language')
    };
  }

  // Watermark module
  var WatermarkModule = {
    watermarkId: null,
    observer: null,
    container: null,

    init: function () {
      this.createWatermark();
    },

    createWatermark: function () {
      var self = this;

      // Remove existing watermark
      this.removeWatermark();

      var watermarkText = this.getWatermarkText(globalConfig.language);
      var watermarkHTML = this.generateWatermarkHTML(watermarkText);

      this.container = document.createElement('div');
      this.container.innerHTML = watermarkHTML;

      var eoWatermark = this.container.querySelector('#edgeone-watermark');
      this.watermarkId = 'edgeone-watermark';

      document.body.appendChild(this.container);

      // Listener to prevent watermark deletion
      this.observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(function (mutation) {
          if (mutation.type === 'childList') {
            if (!document.body.contains(self.container)) {
              document.body.appendChild(self.container);
            }
          }
        });
      });

      this.observer.observe(document.body, { childList: true });

      // Add close button event
      this.addCloseEvent(eoWatermark);

    },

    getWatermarkText: function (language) {
      var texts = {
        en: 'For demonstration and testing purposes only. Please do not enter any sensitive data.',
        zh: '仅用于演示和测试目的。请勿输入任何敏感数据。',
      };
      return texts[language] || texts['en'];
    },

    generateWatermarkHTML: function (watermarkText) {
      return `
        <div id="edgeone-watermark" style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 9999; display: flex; justify-content: center; align-items: flex-end; padding: 50px 15px 15px 15px; box-sizing: border-box; background-image: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0)); pointer-events: none;">
          <div style="display: flex; align-items: center; pointer-events: auto;">
            <span style="font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: rgba(255, 255, 255, 0.85); text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);">
              ${watermarkText}
            </span>
            <span id="edgeone-watermark-close" style="display: inline-block; width: 12px; height: 12px; margin-left: 8px; cursor: pointer; position: relative;">
              <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: block;" aria-label="close">
                <line x1="2" y1="10" x2="10" y2="2" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2" stroke-linecap="round"></line>
                <line x1="2" y1="2" x2="10" y2="10" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2" stroke-linecap="round"></line>
              </svg>
            </span>
          </div>
        </div>
      `;
    },

    addCloseEvent: function (eoWatermark) {
      var self = this;
      var eoCloseButton = document.querySelector('#edgeone-watermark-close');

      if (eoWatermark && eoCloseButton) {
        eoCloseButton.addEventListener('click', function () {
          eoWatermark.style.transition =
            'visibility 0.2s, opacity 0.2s ease-out';
          eoWatermark.style.opacity = '0';
          eoWatermark.style.visibility = 'hidden';

          if (self.observer) {
            self.observer.disconnect();
          }

        });
      }
    },

    removeWatermark: function () {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      this.container = null;
      this.watermarkId = null;
    },
  };

  // FAB (Floating Action Button) module
  var FabModule = {
    fabId: null,
    fabContainer: null,

    init: function () {
      this.createFAB();
    },

    createFAB: function () {
      var self = this;

      // Remove existing FAB
      this.removeFAB();

      // Create styles
      this.createStyles();

      // Create FAB container
      this.fabContainer = document.createElement('div');
      this.fabContainer.id = 'fab-popup';
      this.fabContainer.innerHTML = this.generateFABHTML();

      document.body.appendChild(this.fabContainer);

      // Delay showing FAB (avoid showing in headless browsers)
      if (!navigator.userAgent.includes('HeadlessChrome')) {
        setTimeout(function () {
          // self.fabContainer.style.bottom = '20px';
        }, 2000);
      }

      // Add event listeners
      this.addEventListeners();

      // Load Google Analytics
      this.loadGoogleAnalytics();

    },

    createStyles: function () {
      // Check if styles already exist
      if (document.getElementById('fab-styles')) {
        return;
      }

      var styles = `
#fab-popup {
  box-sizing: content-box;
  display: block;
  position: fixed;
  z-index: 9999;
  right: 20px;
  bottom: -300px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px;
  border-radius: 10px;
  width: 250px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  font-size: 13px;
  transition: bottom 0.5s ease;
  font-family: system-ui, sans-serif;
  text-align: center;
}
#fab-close {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
#fab-close:hover path {
  stroke: #ffffff;
}
#fab-deploy-button {
  font-size: 14px;
  font-style: normal;
  background-color: #1c66e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  margin-bottom: 10px;
  margin-top: 8px;
  display: inline-block;
  margin-left: auto;
  margin-right: auto;
  font-weight: bold;
  line-height: 20px;
}
#fab-deploy-button:hover {
  background-color: #0055d2;
}
#fab-popup a {
  color: #fae15e;
  text-decoration: none;
  font-weight: 600;
}
#fab-popup p {
  margin: 0;
  line-height: normal;
  text-align: left;
  font-family: sans-serif;
  letter-spacing: normal;
}
`;

      var styleElement = document.createElement('style');
      styleElement.id = 'fab-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    },

    generateFABHTML: function () {
      var deployText = this.getDeployText(globalConfig.language);
      var descriptionText = this.getDescriptionText(globalConfig.language);

      return `
  <svg id="fab-close" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8L8 16" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 8L16 16" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>
  </svg>
  <div id="fab-deploy-button">${deployText}</div>
  <p>${descriptionText}</p>
`;
    },

    getDeployText: function (language) {
      var texts = {
        en: '🚀 Deploy Now - Free!',
        zh: '🚀 立即部署 - 免费！',
      };
      return texts[language] || texts['en'];
    },

    getDescriptionText: function (language) {
      var texts = {
        en: 'Power up your site with <a href="https://edgeone.ai/products/pages" target="_blank">EdgeOne</a> - Get lightning-fast global CDN delivery, instantly and completely free',
        zh: '使用 <a href="https://edgeone.ai/products/pages" target="_blank">EdgeOne</a> 为您的网站提供动力 - 获得闪电般快速的全球 CDN 交付，即时且完全免费',
      };
      return texts[language] || texts['en'];
    },

    addEventListeners: function () {
      var self = this;

      // Close button event
      var closeButton = document.getElementById('fab-close');
      if (closeButton) {
        closeButton.addEventListener('click', function () {
          self.fabContainer.style.display = 'none';
        });
      }

      // Deploy button event
      var deployButton = document.getElementById('fab-deploy-button');
      if (deployButton) {
        deployButton.addEventListener('click', function () {
          self.handleDeployClick();
        });
      }
    },

    handleDeployClick: function () {
      var projectInfo = this.extractProjectName();
      var deployUrl;

      if (globalConfig.language === 'zh') {
        deployUrl =
          'https://console.cloud.tencent.com/edgeone/pages/new?from=github&template=' +
          projectInfo.projectName;
      } else {
        deployUrl =
          'https://edgeone.ai/pages/new?template=' +
          projectInfo.projectName +
          '&from=github';
      }

      window.open(deployUrl, '_blank');
    },

    extractProjectName: function () {
      var fullUrl = window.location.href;
      var urlObject = new URL(fullUrl);
      var hostname = urlObject.hostname;
      var parts = hostname.split('.');

      return {
        projectName: parts[0].replace('-zh', ''),
        domain: parts.slice(1).join('.'),
      };
    },

    loadGoogleAnalytics: function () {
      var GA_ID = 'G-MBR88GEWNE';

      if (!GA_ID) {
        console.warn('Google Analytics ID not defined');
        return;
      }

      function createAnalyticsScripts() {
        try {
          var script1 = document.createElement('script');
          script1.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
          script1.async = true;

          var script2 = document.createElement('script');
          script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `;

          document.head.appendChild(script1);
          document.head.appendChild(script2);
        } catch (err) {}
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAnalyticsScripts);
      } else {
        createAnalyticsScripts();
      }
    },

    removeFAB: function () {
      if (this.fabContainer && this.fabContainer.parentNode) {
        this.fabContainer.parentNode.removeChild(this.fabContainer);
      }

      // Remove styles
      var styleElement = document.getElementById('fab-styles');
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }

      this.fabContainer = null;
      this.fabId = null;
    },
  };

  // Main initialization function
  function init() {
    try {
      // Wait for DOM to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
      }

      // Set global configuration
      globalConfig = getScriptConfig();

      // Execute different functionality based on mode
      switch (globalConfig.mode) {
        case 'watermark':
          WatermarkModule.init();
          break;
        case 'fab':
          FabModule.init();
          break;
        default:
          WatermarkModule.init();
          break;
      }
    } catch (error) {
      console.error('Initialization failed', error);
    }
  }

  // Global error handling
  window.addEventListener('error', function (event) {
    if (event.filename && event.filename.indexOf('unified.js') !== -1) {
      console.error('Script runtime error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  // Start initialization
  init();
})();
