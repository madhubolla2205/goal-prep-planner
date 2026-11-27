package io.github.madhubolla2205.goalprep;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // BridgeActivity switches from the splash theme to the app theme and
        // creates the window first. Turning on edge to edge before that built
        // the window with the splash theme, which added a title bar showing a
        // squashed splash image above the app (reported by a tester in 1.0.20).
        super.onCreate(savedInstanceState);
        // Draw under the status and navigation bars on every Android version,
        // as Android 15 and later already require. The web app pads its content
        // by the system bar insets (see --safe-top in index.css), so nothing is
        // hidden behind the bars.
        EdgeToEdge.enable(this);
    }
}
