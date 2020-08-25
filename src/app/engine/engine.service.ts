import * as THREE from 'three';
import { Injectable, ElementRef, OnDestroy, NgZone, Input } from '@angular/core';
import * as GeoTIFF from "geotiff";

@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private light: THREE.AmbientLight;

  private cube: THREE.Mesh;

  private frameId: number = null;

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // create the scene
    this.scene = new THREE.Scene();

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 10000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(1000, 1000, 1000);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight( 0x404040 );
    this.light.position.z = 10;
    this.scene.add(this.light);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh( geometry, material );
    // this.scene.add(this.cube);
  }
  
  setupTerrainModel(dem: File, browse: File) {
    const readGeoTif = async () => {
      console.log(dem);
      const rawTiff  = await GeoTIFF.fromBlob(dem);
      const tifImage = await rawTiff.getImage();
     
      const image = {
        width: tifImage.getWidth(),
        height: tifImage.getHeight()
      };
      const geometry = new THREE.PlaneGeometry(
        image.width,
        image.height,
        image.width - 1,
        image.height - 1
      );
      const data = await tifImage.readRasters({ interleave: true });

      console.time("parseGeom");
      geometry.vertices.forEach((geom,index) => {
        geom.z = (data[index] / 20) * -1;
      });
      console.timeEnd("parseGeom");
      let userImageURL = URL.createObjectURL(browse);
      let texture = new THREE.TextureLoader().load(userImageURL);
      const material = new THREE.MeshLambertMaterial({
        wireframe: false,
        side: THREE.DoubleSide,
        map: texture
      });
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.y = -100;
      mountain.rotation.x = Math.PI / 2;

      this.scene.add(mountain);
    };

    readGeoTif();
  }
  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( width, height );
  }
}
