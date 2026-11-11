# Verificação do protótipo

Validação realizada na sessão de desenvolvimento: JavaScript sem erro de sintaxe (`node --check`), interface de oficina e motorista renderizadas no Chromium (fontes com fallback local), fluxo `Em manutenção` → `Pronto para retirada` refletido na visão do motorista, viewport de 390 px sem rolagem horizontal.

O teste está em `tests/test_demo.py`. **Apenas protótipo local:** não comprova isolamento RLS real, notificações entregues, autenticação ou builds Android/iOS.
