package io.github.madhubolla2205.goalprep;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Draw under the status and navigation bars on every Android version,
        // as Android 15 and later already require. The web app pads its content
        // by the system bar insets (see --safe-top in index.css), so nothing is
        // hidden behind the bars.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
