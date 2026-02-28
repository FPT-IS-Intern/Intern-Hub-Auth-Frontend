import { Component } from "@angular/core";
import {
  HeaderComponent,
  SidebarComponent,
  ButtonContainerComponent,
  PopUpConfirmComponent
} from "@goat-bravos/intern-hub-layout";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-terms",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent,
    ButtonContainerComponent,
    PopUpConfirmComponent
  ],
  templateUrl: "./terms.component.html",
  styleUrls: ["./terms.component.scss"]
})
export class TermsComponent {

  accepted = false;
  showConfirm = false;

  headerData = {
    headerItems: [],
    userName: "Gia Huy",
    userIcon: "dsi-user-01-line",
    logo: "assets/logo.png"
  };

  sidebarData = {
    menuItems: [
      {
        iconLeft: "dsi-home-01-line",
        content: "Trang chủ",
        url: "/home"
      }
    ]
  };

  continue() {
    if (!this.accepted) {
      this.showConfirm = true;
      return;
    }

    console.log("Accepted terms");
  }
}
