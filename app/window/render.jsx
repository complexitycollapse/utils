import { createRoot } from 'react-dom/client'
import { ChooserComponent } from './chooser-component';

const startComponent = new URLSearchParams(window.location.search).get("component");

createRoot(document.getElementById('root')).render(
  <ChooserComponent component={startComponent}/>
);
