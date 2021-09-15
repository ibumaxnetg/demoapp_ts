import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import { firebaseStore, firebaseStorage } from './fireconfig'
import { imageUpdateFireStorage } from './ResizeUtil';





// Drag & Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public manday: number,
    public status: ProjectStatus,
    public regions: string,
  ) {}
}

enum ProjectStatus {
  Active,
  Finished,
}

interface SendData {
  title: string,
  description: string,
  manday: number,
  id?: string,
  imgFile ? : File,
  status?: ProjectStatus| undefined,
  regions?: string,
}

interface getQueryObject {
    [key: string]: string;
}

// abstract class Component {

//   constructor(
//   ) {
//   }

// }





// autobind decoretor
function autobind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const acjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return acjDescriptor;
}

// function validate() {
// }


class ProjectState {
  projectContainer: Project[] = [];
  projectListeners: Function[] = [];
  queryObj: getQueryObject = {};

  constructor() {
    // console.log('ProjectState start');
    this.getQuery();
    this.readData();
  }

  getQuery() {
    const queryString: string[] = location.search.substring(1).split('&');
    // console.log(queryString);

    if (queryString[0] !== "") {
      for(const qryStr of queryString) {
        const kv = qryStr.split('=');
        this.queryObj[kv[0]] = kv[1];
      }
      // console.log('getQuery', this.queryObj);
    }
    // アドレスバー書き換え
    history.replaceState('','','./firetest.html');
  }

  async readData() {
    // console.log('ProjectState readData start');
    // DBからデータを取得しクラスに設定する
    await firebaseStore.collection("project").get().then((querySnapshot) => {
      querySnapshot.forEach( async (doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        const docData = doc.data();
        // console.log(docData);
        const docStatus = docData.status === 0 ? ProjectStatus.Active : ProjectStatus.Finished;
        const newProject = new Project(
          docData.id,
          docData.title,
          docData.description,
          docData.manday,
          docStatus,
          docData.regions,
        );
        await this.projectContainer.push(newProject);
        if (newProject.id === this.queryObj.id) {
          await PrjInput.renderContent(newProject);
        }
      });
    });

    this.sortProject();
    await this.updateProject();
    // console.log('updateProject:', this.projectContainer);
  }

  async addProject(sendData: SendData, inputImgDel: 'del'| 'off') {
    let newProject: Project;
    if (sendData.status === undefined) {
      sendData.status = ProjectStatus.Active;
    }
    if (sendData.regions === undefined) {
      sendData.regions = '';
    }
    if (sendData.id === undefined || sendData.id === '') {
      console.log('addProject start:', sendData.imgFile);
      newProject = new Project(
        Math.random().toString(),
        sendData.title,
        sendData.description,
        sendData.manday,
        ProjectStatus.Active,
        'region',
        );
      await this.dbset(newProject, sendData.imgFile);
      this.projectContainer.push(newProject);
    } else {
      console.log('editProject start:', sendData.imgFile);
      newProject = new Project(
        sendData.id,
        sendData.title,
        sendData.description,
        sendData.manday,
        sendData.status,
        sendData.regions,
        );
      await firebaseStore.collection("project").doc(sendData.id).update({
        title: sendData.title,
        description: sendData.description,
        manday: sendData.manday,
      })
      .then((docRef) => {
        console.log("Document edit ID: ", sendData.id, '/', docRef);
      })
      .catch((error) => {
        console.error("Error document edit: ", error);
      });
      await this.changeStatus(newProject);

      if (inputImgDel === 'del') {
        //画像ファイルの削除
        await firebaseStorage.ref().child("image/" + sendData.id).delete()
          .then(() => {
            console.log("addProject Document ImgDel ID: ", sendData.id);
          })
          .catch((error) => {
            console.error("Error ImgDel: ", error);
          });
      }

      if (sendData.imgFile) {
      // イメージサイズを変え FireStorage に保存する
      await imageUpdateFireStorage(sendData.id, sendData.imgFile);
      }
    }
    // console.log(this.projectContainer);

    this.sortProject();
    await this.updateProject();
  }

  sortProject() {
    // project のソート
    this.projectContainer.sort(function(a,b){
      if(a.manday < b.manday) return -1;
      if(a.manday > b.manday) return 1;
      return 0;
    });
  }

  async changeStatus(sendData: Project) {
    const changeProject = this.projectContainer.find((project) => {
      if (project.id === sendData.id) {
        return project;
      }
      return;
    });
    if (changeProject) {
      // console.log('changeStatus', changeProject);
      changeProject.title = sendData.title;
      changeProject.description = sendData.description;
      changeProject.manday = sendData.manday;
    }
  }

  async moveProject(prjId: string, prjStatus: 'active' | 'finished') {
    const changeProject = this.projectContainer.find((project) => {
      if (project.id === prjId) {
        return project;
      }
      return;
    });
    // console.log(prjId, prjStatus,changeProject );
    if (changeProject) {
      changeProject.status = prjStatus === 'active' ? ProjectStatus.Active : ProjectStatus.Finished;

      // statusDB側書き換え
      this.statusChange(changeProject);
    }
    await this.updateProject();
    // console.log(this.projectContainer, changeProject );
    return;
  }

  async statusChange(setproject: Project) {
    await firebaseStore.collection("project").doc(setproject.id).update({
        status: setproject.status
      })
      .then(() => {
        console.log("Document update ID: ", setproject.id);
      })
      .catch((error) => {
        console.error("Error update document: ", error);
      });
  }

  addListener(listenerFn: Function) {
    this.projectListeners.push(listenerFn);
  }

  async updateProject() {
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projectContainer.slice());
    }
  }

  async dbset(project: Project, inputImgFile ? : File) {
    let newId = 'sample';
    const timeStamp = firebase.firestore.FieldValue.serverTimestamp();
    // console.log('timestamp:', timeStamp);
    await firebaseStore.collection("project").add({
        id: 'defauletId',
        title: project.title,
        description: project.description,
        manday: project.manday,
        status: project.status,
        regions: timeStamp,
      })
      .then((docRef) => {
        console.log("Document written with ID: ", docRef);
        // class Project にIDを設定
        newId = docRef.id;
        project.id = newId;
        // project.regions = timeStamp;
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });

    await firebaseStore.collection("project").doc(newId).update({
        id: newId
      })
      .then(() => {
        console.log("Document newSet ID: ", newId);
      })
      .catch((error) => {
        console.error("Error newSet document: ", error);
      });



    if (inputImgFile) {
      // イメージサイズを変え FireStorage に保存する
      await imageUpdateFireStorage(newId, inputImgFile);
    }
  }

  async delProject(projectId: string) {
    const tmpProject = this.projectContainer.filter((project) => {
      if (project.id !== projectId) {
        return project;
      }
      return;
    });
    this.projectContainer = tmpProject;

    // DBから削除
    await firebaseStore.collection("project").doc(projectId).delete().then(() => {
      console.log("Document successfully deleted!");
    }).catch((error) => {
      console.error("Error removing document: ", error);
    });

    const desertRef = firebaseStorage.ref().child(`image/${projectId}`);

    // Delete the file
    await desertRef.delete().then(function() {
      console.log("Imagefile successfully deleted!");
    }).catch((error) => {
      console.error("Error removing Imagefile: ", error);
    });

    console.log('delProject:', this.projectContainer);
    await this.updateProject();
    PrjInput.clearInputs();
  }
}





class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  inputTtlElement: HTMLInputElement;
  inputDescElement: HTMLInputElement;
  inputMdElement: HTMLInputElement;
  inputImageElement: HTMLInputElement;
  inputImageDelElement: HTMLInputElement;

  sendProjectId: string;
  sendProjectStatus: ProjectStatus;
  sendProjectRegions: any;

  constructor() {
    // console.log('ProjectInput start');
    this.baseElements = document.getElementById('project-input') !as HTMLTemplateElement;
    this.outputElements = document.getElementById('app') !as HTMLDivElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLFormElement;
    this.editElements.id = 'user-input';

    this.inputTtlElement = this.editElements.querySelector('#title') !;
    this.inputDescElement = this.editElements.querySelector('#description') !;
    this.inputMdElement = this.editElements.querySelector('#manday') !;
    this.inputImageElement = this.editElements.querySelector('#photo') !;
    this.inputImageDelElement = this.editElements.querySelector('#photodel') !;

    // console.log(this.outputElements);
    this.sendProjectId = '';
    this.sendProjectStatus = ProjectStatus.Active;
    this.sendProjectRegions = '';

    this.configure();
    this.attach();
  }



  @autobind
  submitHandler(event: Event) {
    event.preventDefault();
    const inputTtlTx = this.inputTtlElement.value;
    const inputDescTx = this.inputDescElement.value;
    const inputMdTx = Number(this.inputMdElement.value);
    let inputImgFile: File | undefined;
    const inputImgDel: 'del'| 'off' = this.inputImageDelElement.checked === true ? 'del' : 'off';


    if (this.inputImageElement.files !== null) {
      inputImgFile = this.inputImageElement.files[0];
    }

    console.log('ProjectInput inputImgFile:', inputImgFile, inputImgDel);

    const sendData: SendData = {
      title: inputTtlTx,
      description: inputDescTx,
      manday: inputMdTx,
      id: this.sendProjectId,
      imgFile: inputImgFile,
      status: this.sendProjectStatus,
      regions: this.sendProjectRegions,
    }

    if (
      inputTtlTx && inputDescTx && inputMdTx
    ) {
      prjState.addProject(sendData, inputImgDel);
      this.clearInputs();
    } else {
      alert('入力を確認してください');
    }
  }

  clearInputs() {
    this.inputTtlElement.value = '';
    this.inputDescElement.value = '';
    this.inputMdElement.value = '';
    this.inputImageElement.value = '';
    this.inputImageDelElement.checked = false;
  }

  configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  async renderContent(newProject: Project) {
    this.inputTtlElement.value = newProject.title;
    this.inputDescElement.value = newProject.description;
    this.inputMdElement.value = newProject.manday.toString();
    this.sendProjectId = newProject.id
    this.sendProjectStatus = newProject.status;
    this.sendProjectRegions = newProject.regions;
    // console.log('ProjectInput renderContent Project:', this.sendProjectId, '/', this.sendProjectStatus, '/', this.sendProjectRegions);
  }


  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}





class ProjectList implements DragTarget {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLElement;

  assignedProjects: Project[];

  constructor(public listType: 'active' | 'finished') {
    // console.log('ProjectList start', listType);
    this.baseElements = document.getElementById('project-list') !as HTMLTemplateElement;
    this.outputElements = document.getElementById('app') !as HTMLDivElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLElement;
    this.editElements.id = `${listType}-projects`;

    // console.log(this.editElements);

    this.assignedProjects = [];

    this.configure();
    this.renderContent();
    this.attach();
  }

  renderProjects() {
    const addUlElement = this.editElements.querySelector('ul') !;
    addUlElement.id = `${this.listType}-projects-list`;
    addUlElement.innerHTML = "";

    this.assignedProjects.forEach((project) => {
      new ProjectItem(project, `${this.listType}-projects-list`);
    });
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      const onElement = this.editElements.querySelector('ul') !;
      onElement.classList.add('droppable');
    }
    // console.log('dragOver');
  }

  @autobind
  dropHandler(event: DragEvent): void {
    event.preventDefault();
    const datatmp = event.dataTransfer!.getData('text/plain');

    const onElement = this.editElements.querySelector('ul') !;
    onElement.classList.remove('droppable');

    // console.log('drop', datatmp);
    prjState.moveProject(datatmp, this.listType);
  }

  @autobind
  dragLeaveHandler(event: DragEvent): void {
    event.preventDefault();
    const onElement = this.editElements.querySelector('ul') !;
    onElement.classList.remove('droppable');
    // console.log('dragLeave');
  }

  renderContent() {
    const addH2Element = this.editElements.querySelector('h2') !;
    addH2Element.textContent = this.listType === 'active' ? 'active Projects' : 'finished Projects';
  }

  configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const tmpProject = projects.filter((project) => {
        if (this.listType === 'active') {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.assignedProjects = tmpProject;
      this.renderProjects();
    });

  }

  attach() {
    this.outputElements.insertAdjacentElement('beforeend', this.editElements);
  }
}




class ProjectItem implements Draggable {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLUListElement;
  editElements: HTMLLIElement;

  project: Project;

  constructor(
    public projectData: Project,
    public ulistId: string,
  ) {
    this.project = projectData;

    this.baseElements = document.getElementById('single-project') !as HTMLTemplateElement;
    this.outputElements = document.getElementById(ulistId) !as HTMLUListElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLLIElement;
    this.editElements.id = this.project.id;
    this.editElements.draggable = true;

    this.renderContent();
    this.configure();
    this.attach();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', this.project.id);

    // console.log('dragStart', this.project.id);
  }

  @autobind
  dragEndHandler(_event: DragEvent): void {
    // const datatmp = event.dataTransfer!.getData('text/plain');
    // console.log('dragEnd', datatmp);
  }

  configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  async renderContent() {
    const newH2 = document.createElement('h2');
    const newH3 = document.createElement('h3');
    const newP1 = document.createElement('p');
    const newP2 = document.createElement('p');
    const newP3 = document.createElement('img');
    const newBtn = document.createElement('button');
    const newAnk = document.createElement('a');
    // newH2.textContent = this.project.title;
    newH3.textContent = this.project.description;
    newP1.textContent = 'manday:' + this.project.manday.toString() + `/ regions:` + this.project.regions;
    // newP2.textContent = this.project.id + '/status:' + this.project.status;

    newAnk.href = `./firetest.html?id=${this.project.id}&title=${this.project.title}`;
    newAnk.textContent = this.project.title;
    newH2.appendChild(newAnk);

    // 画像データ取得
    const imagesRef = firebaseStorage.ref().child(`image/${this.project.id}`);

    imagesRef.getDownloadURL()
      .then((url) => {
        newP3.setAttribute('src', url);
      })
      .catch((error) => {
        console.error("Error printImg document: ", error);
      });

    await imagesRef.getMetadata().then(function(metadata) {
      // console.log('getMetadata', metadata);
      newP2.textContent = `${metadata.contentType} ${metadata.size}`;
      newP3.alt = metadata.contentType;
    }).catch(function(error) {
      console.error("Error getMetadata document: ", error);
    });

    newBtn.textContent = '削除する';
    newBtn.onclick = async () => {
      await prjState.delProject(this.project.id);
      // console.log(newBtn, this.project.id);
    }

      newP3.classList.add('skeleton');
      newP2.classList.add('skeleton');
      newP1.classList.add('skeleton');
      newP2.classList.add('skeleton-text');
      newP1.classList.add('skeleton-text');

    this.editElements.appendChild(newH2);
    this.editElements.appendChild(newH3);
    this.editElements.appendChild(newP1);
    this.editElements.appendChild(newP2);
    this.editElements.appendChild(newP3);
    this.editElements.appendChild(newBtn);
  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}



      const prjState = new ProjectState();
new ProjectList('active');
new ProjectList('finished');
// const actvPrjList = new ProjectList('active');
// const finsPrjList = new ProjectList('finished');
const PrjInput = new ProjectInput();

