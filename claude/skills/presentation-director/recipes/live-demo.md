# Recipe: live-demo

**Status: not yet run through this kit.**

A person presents a product, advancing by keypress. Slides and a staged product UI in one fixed stage.

- **Stages:** brief, script as speaker notes, build, one review round. Art rivals only when there's no existing product look. Usually the product's own UI is the look.
- **Output:** one-file HTML first. Add voice only if asked. Without narration, use a `script.json` with estimated times, or fixed times per step.
- **Player:** mark lines `stop: true` so it waits for a keypress. Use the presenter window (`P`), fast-forward (`F`) and deep links (`#t=`). Test them on the actual presenting machine, including fonts.
- **Choreography:** real camera zooms to the part in focus, a cursor that arrives on the word, click ripples, typing with reserved layout, focus by dimming the rest.
- **Check:** every step works when reached by going backwards and by deep link.
