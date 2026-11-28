package com.distran.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.distran.app.ui.DistranApp
import com.distran.app.ui.theme.DistranTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.parseColor("#070708")),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.parseColor("#070708"))
        )
        setContent {
            DistranTheme {
                DistranApp()
            }
        }
    }
}
