package dev.niaodan.cards

import android.os.Bundle
import android.view.View
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlin.math.max

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    applyWindowInsets(findViewById(android.R.id.content))
  }

  override fun onWebViewCreate(webView: WebView) {
    webView.post {
      val target = (webView.parent as? View) ?: findViewById(android.R.id.content)
      applyWindowInsets(target)
      ViewCompat.requestApplyInsets(target)
    }
  }

  private fun applyWindowInsets(view: View) {
    ViewCompat.setOnApplyWindowInsetsListener(view) { v, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
      v.setPadding(bars.left, bars.top, bars.right, max(bars.bottom, ime.bottom))
      WindowInsetsCompat.CONSUMED
    }
  }
}
