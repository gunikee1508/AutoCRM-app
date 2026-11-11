# Protótipo de UX AutoCRM

Abra `index.html` no navegador (sem instalar nada). Também pode servir a pasta local com `python -m http.server 8000`.

## Testes manuais
1. Entre na **Oficina** → Ordens de serviço → Gerenciar → marque **Pronto para retirada**.
2. Observe o registro de notificação simulada, com mensagem pronta e endereço configurado.
3. Alterne para **Motorista** → observe o status atualizado e o endereço de retirada.
4. Retorne à Oficina → Configurações → altere WhatsApp normal/Business e endereço.
5. Crie um novo atendimento, marque como pronto e veja como muda o comportamento.

**Atenção:** é uma demonstração de interface com `localStorage` e dados fictícios, sem login, servidor, API de mensagens ou proteção para dados reais. NÃO utilize com clientes reais.
