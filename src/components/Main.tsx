export default () => (
  <html>
    <head>
      <title>YPT stats generator</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
    </head>
    <body hx-target="body">
      <p>hi this is the ypt stats generator!!</p>
      <button hx-post="/otg">lets GOo</button>
    </body>
  </html>
);
