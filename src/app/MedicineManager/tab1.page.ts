import { GoogleCalendarService } from './../Services/GoogleCalendarService/google-calendar.service';
import { MedicineServiceService } from '../Services/medicine-service/MedicineService.service';
import { AfterViewInit, Component, DoCheck, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { Prescription } from '../models/prescription';
import { from } from 'rxjs';
import { AlertController, IonModal, LoadingController, ModalController, NavController } from '@ionic/angular';
import { ComponentBase } from '../shared/ComponentBase/ComponentBase';


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page extends ComponentBase implements  OnInit{
  prescriptionForm!: FormGroup;
  ListPres:Prescription[] = [];
  //@ViewChild('modal', { static: true }) modalContent!:IonModal;

  isModalOpen:boolean = false;
  modalStates: { [key: string]: boolean } = {};
  isUong: boolean = false;
  public alertButtonsMedipop = [
    {
      text: 'Hủy',
      cssClass: 'alert-button-cancel',
    },
    {
      text: 'Xác nhận',
      cssClass: 'alert-button-confirm',
      handler:(id:string) => {
          console.log(id);
      }
    },
  ];
  constructor(private formBuilder: FormBuilder,
              private route: Router,
              private navCtrl: NavController,
              private MedicineService:MedicineServiceService,
              private readonly loadingCtrl: LoadingController,
              private modalController: ModalController,
              private alertController: AlertController,
              private GoogleCalendarService: GoogleCalendarService
              ) {
                super();
    this.prescriptionForm = this.formBuilder.group({
      prescriptionName: ['', Validators.required],
      doctorName: ['', Validators.required],
      medicineStoreName: ['', Validators.required],
      fromDate: [new Date().toISOString(), Validators.required],
      toDate: [new Date().toISOString(), Validators.required],
      buyDate: [new Date().toISOString(), Validators.required],
    });
  }


  // Function to close a specific modal
  async closeModal() {
    const modal = await this.modalController.getTop();
    if(modal){
      modal.dismiss().then(x => {
        if(this.isUong){
          this.InitMedicineList();
          this.isUong = false;
        }
      });
    }
  }
  ngOnInit(): void {
    //this.InitMedicineList();
  }
  async InitMedicineList(){
    const loading = await this.loadingCtrl.create();
    await loading.present();
      from(this.MedicineService.Prescription_List()).subscribe(items => {
          this.ListPres = items;
          console.log(this.ListPres);
      });
    await loading.dismiss();
  }
  submitForm(){

  }
  async DelelePres(pres:Prescription){
    const loading = await this.loadingCtrl.create();
        var IdDTs:string[] = pres.prescriptionDetails.map(x => {
            return x.prescriptionDetailId ?? "";
        });
        await loading.present();
        // xóa lịch nhắc khỏi gg
        var presItem = await this.MedicineService.Prescription_ById(pres.prescriptionId);
        console.log(presItem.eventIds);
        if(presItem.eventIds){
            presItem.eventIds.forEach(async x => {
              await this.GoogleCalendarService.DeleteEvent(x);
            });
        }
        if(await this.MedicineService.Prescription_Del(pres.prescriptionId,IdDTs)){
            this.ShowNofitication("Xóa đơn thuốc thành công");
        }
        else  this.ShowNofitication("Xóa đơn thuốc thất bại");
        await loading.dismiss();
        this.ionViewWillEnter();
  }
  async ionViewWillEnter(){
    const loading = await this.loadingCtrl.create();
    await loading.present();
    this.handleInputSearch();
    this.modalStates = {};
    await loading.dismiss();

  }
  addItem(){

      this.route.navigate(['/add-medicine']);

  }
  editItem(id:string){
    if(id == ''){
        this.ShowNofitication('Có lỗi xảy ra, vui lòng thử lại sau');
        return;
    }
      let paras:any = {
          id: id
      }
      this.NavigateToPage('/add-medicine',paras)
  }
  selectedSegment: string = 'button1';

  selectButton(buttonValue: string) {
    this.selectedSegment = buttonValue;
  }

  NavigateToPage(url:string, paras?:any){
    if(paras){
      console.log(paras);
      const navigationExtras: NavigationExtras = {
        queryParams: paras
      };
      this.navCtrl.navigateForward(url,navigationExtras);
    }
    else{
      this.navCtrl.navigateForward(url);
    }
  }
  MedicineConfirmation(){

  }
  async presentAlert(id: string = '') {
    const alert = await this.alertController.create({
      header: 'Xác nhận sử dụng ?',
      buttons:[
        {
          text: 'Hủy',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Xác nhận',
          cssClass: 'alert-button-confirm',
          handler: async () => {
              this.MedicineService.Prescription_Detail_Confirm(id,'1');
              //await this.InitMedicineList();
              await this.dismissAlert();
              //await this.reloadModal(id);
              this.modalStates[id] = true;
              this.isUong = true;
              this.ShowNofitication("Đã ghi nhận thuốc uống thành công");
          }
        },
      ]
    });

    await alert.present();
  }
  async dismissAlert() {
    const alert = await this.alertController.getTop();
    if (alert) {
      await alert.dismiss();
    }
  }
  async handleInputSearch(event?:any){
    if(event){
      var inputSearch = event.target.value;
    }
     from( this.MedicineService.Prescription_Search(inputSearch)).subscribe(x => {
      this.ListPres = x;
      console.log(this.ListPres);
     });

  }
  ionModalWillDismiss(){

  }
  buttonXClicked(){

  }
  // async doRefresh(event:any){

  //     // Complete the refresh action\
  //   const loading = await this.loadingCtrl.create();
  //   await loading.present();
  //   this.handleInputSearch();
  //   await loading.dismiss();

  //   event.target.complete();

  // }
}
