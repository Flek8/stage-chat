import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { LoginPageModule } from './features/login/login.module';

const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  connectOnCreate: false,
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    HttpClientModule,
    AppRoutingModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS)],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, HttpClientModule],
  bootstrap: [AppComponent],
})


export class AppModule {}
