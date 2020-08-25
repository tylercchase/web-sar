import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EngineService } from "../../engine/engine.service";
@Component({
  selector: 'app-ui-infobar-bottom',
  templateUrl: './ui-infobar-bottom.component.html'
})
export class UiInfobarBottomComponent implements OnInit {


  public constructor(private engineService: EngineService) { }

  public ngOnInit(): void {
  }
  private dem : File;
  private browse : File;
  public demInputEvent(demFile: any){
    this.dem = demFile.target.files[0];
    this.checkToRender();
  }
  public browseInputEvent(browseFile: any){
    this.browse = browseFile.target.files[0];
    this.checkToRender();
  }
  public checkToRender(){
    if(this.dem && this.browse){
      this.engineService.setupTerrainModel(this.dem, this.browse);
    }

  }
}
