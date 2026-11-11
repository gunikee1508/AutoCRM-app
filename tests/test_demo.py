"""Teste visual-funcional local da demonstração AutoCRM.
Requer `pip install playwright` e navegador Chromium disponível.
Não realiza rede nem envia mensagens.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PROTO = ROOT / 'prototype'

def html_inline():
    css = (PROTO/'styles.css').read_text(encoding='utf-8')
    # Ambiente de teste sem acesso à fonte remota; utiliza fonte de fallback.
    css = css[css.index(':root'):]
    js = (PROTO/'app.js').read_text(encoding='utf-8')
    return (PROTO/'index.html').read_text(encoding='utf-8').replace(
        '<link rel="stylesheet" href="styles.css">', f'<style>{css}</style>'
    ).replace('<script src="app.js"></script>', f'<script>{js}</script>')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.set_content(html_inline(), wait_until='domcontentloaded')
    assert 'Bom dia, equipe!' in page.locator('main').inner_text()
    page.locator('[data-action="order:128"]').first.click()
    page.locator('#statusSelect').select_option('ready')
    page.locator('[data-action="save-status:128"]').click()
    assert 'Cliente pronto para ser avisado' in page.locator('#modal').inner_text()
    page.locator('[data-action="close"]').last.click()
    page.locator('[data-role="customer"]').click()
    assert 'Seu carro está pronto!' in page.locator('main').inner_text()
    assert not errors, errors
    mobile = browser.new_page(viewport={'width':390,'height':844})
    mobile.set_content(html_inline(), wait_until='domcontentloaded')
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    browser.close()
print('PASS: interface da oficina, status pronto, área do motorista, mobile sem overflow e sem erros JS')
