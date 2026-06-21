package com.torque.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Botão "voltar" do Android: navega no histórico da WebView (as rotas do site,
     * que usam History API/pushState) quando houver para onde voltar. Só sai do app
     * quando estiver na primeira tela (sem histórico).
     */
    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
        } else {
            super.onBackPressed();
        }
    }
}
