import re

with open("index.html", "r") as f:
    content = f.read()

error_script = """    <script>
      window.addEventListener('error', function(event) {
        console.error('Global error caught:', event.error);
        if (!document.getElementById('root').innerHTML) {
          document.getElementById('root').innerHTML = '<div style="padding: 20px; font-family: sans-serif; color: red;"><h2>Application Error</h2><p>' + (event.error ? event.error.message : event.message) + '</p></div>';
        }
      });
      window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection caught:', event.reason);
      });
    </script>
"""

if error_script not in content:
    content = content.replace('<div id="root"></div>', '<div id="root"></div>\n' + error_script)

with open("index.html", "w") as f:
    f.write(content)
