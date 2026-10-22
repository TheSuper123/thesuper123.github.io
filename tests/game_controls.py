"""Open the real configuration dialog before changing a hidden game option."""
def choose_option(control, value):
    opened = not control.is_visible()
    if opened:
        control.evaluate('(el)=>el.ownerDocument.querySelector(".gv-options").click()')
    control.select_option(value)
    if opened:
        control.locator('xpath=ancestor::dialog').get_by_role('button',name='Zamknij opcje',exact=True).click()
