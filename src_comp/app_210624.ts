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
  ) {}
}

enum ProjectStatus {
  Active,
  Finished,
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

function validate() {
}




class ProjectState {
  projectContainer: Project[] =[];
  projectListeners: Function[] =[];

  constructor() {}

  addProject(titleString: string, descDtring: string, mandayNumber: number) {
    const newProject = new Project(
      Math.random().toString(),
      titleString,
      descDtring,
      mandayNumber,
      ProjectStatus.Active,
    );
    this.projectContainer.push(newProject);
    this.updateListeners();
  }

  addListener(listenerFn: Function) {
    this.projectListeners.push(listenerFn);
  }

  moveProject(moveId: string, prjStatus: 'active'| 'finished') {
    const changeProject = this.projectContainer.find((project) => {return project.id === moveId});
    // console.log('moveProject', changeProject, prjStatus);
    if (changeProject) {
      changeProject.status = prjStatus === 'active' ? ProjectStatus.Active: ProjectStatus.Finished;
    }
    this.updateListeners();
  }

  private updateListeners() {
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projectContainer.slice());
    }
  }
}





class ProjectInput {
  baseElements: any;
  outputElements: any;
  editElements: any;

  inputTitleElement: HTMLInputElement;
  inputDescElement: HTMLInputElement;
  inputMandayElement: HTMLInputElement;

  constructor(
    public tempId: string = 'project-input',
    public dispId: string = 'app',
    public addAt: boolean = true,
    public editId: string = 'user-input',
  ) {
    this.baseElements = document.querySelector(`#${tempId}`)! as HTMLTemplateElement;
    this.outputElements = document.querySelector(`#${dispId}`)! as HTMLDivElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLFormElement;
    this.editElements.id = editId;

    this.inputTitleElement = this.editElements.querySelector('#title');
    this.inputDescElement = this.editElements.querySelector('#description');
    this.inputMandayElement = this.editElements.querySelector('#manday');

    this.configure();
    this.renderContent();
    this.attach(addAt);
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, manday] = userInput;
      prjState.addProject(title, description, manday);
      this.clearInputs();
    }
  }

  private gatherUserInput():[string, string, number]| void {
    const inputTitle = this.inputTitleElement.value;
    const inputDesc = this.inputDescElement.value;
    const inputManday = this.inputMandayElement.value;

    if (inputTitle && inputDesc && inputManday) {
      return [inputTitle, inputDesc, +inputManday];
    } else {
      let errCom = '';
      if (!inputTitle) {errCom = 'タイトル';}
      if (!inputDesc) {errCom = errCom +' 説明';}
      if (!inputManday) {errCom = errCom +' 人日';}

      alert(errCom + ' の入力が正しくありません');
    }

  }

  private clearInputs() {
    this.inputTitleElement.value = '';
    this.inputDescElement.value = '';
    this.inputMandayElement.value = '';
  }
  private configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  private renderContent() {}
  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin': 'beforeend', this.editElements);
  }
}





class ProjectList {
  assignedProject: Project[];

  baseElements: any;
  outputElements: any;
  editElements: any;

  constructor(
    public listType: 'active' | 'finished',

    public tempId: string = 'project-list',
    public dispId: string = 'app',
    public addAt: boolean = false,
    public editId: string = `${listType}-projects`,
  ) {
    this.assignedProject = [];

    this.baseElements = document.querySelector(`#${tempId}`)! as HTMLTemplateElement;
    this.outputElements = document.querySelector(`#${dispId}`)! as HTMLElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild! as HTMLFormElement;
    this.editElements.id = editId;

    this.configure();
    this.renderContent();
    this.attach(addAt);
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      const targetElement = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
      targetElement.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    event.preventDefault();
    const moveId = event.dataTransfer!.getData('text/plain');
    // console.log('drag drop', moveId);
    prjState.moveProject(moveId, this.listType);
  }

  @autobind
  dragLeaveHandler(event: DragEvent): void {
    event.preventDefault();
    const targetElement = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    targetElement.classList.remove('droppable');
    // console.log('drag leave');
  }

  private renderProject() {
    const projectUl = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    projectUl.innerHTML = '';
    this.assignedProject.forEach((project) => {
      new ProjectItem(project, `${this.listType}-projects-list`);
    });
  }

  private renderContent() {
    this.editElements.querySelector('h2').textContent = this.listType === 'active' ? 'やってるよ': 'おわったよ';
    this.editElements.querySelector('ul').id = `${this.listType}-projects-list`;
  }

  private configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const appliProject = projects.filter((project) => {
        if (this.listType === 'active') {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.assignedProject = appliProject;
      this.renderProject();
    });
  }

  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin': 'beforeend', this.editElements);
  }
}




class ProjectItem {
  baseElements: any;
  outputElements: any;
  editElements: any;

  project:Project;

  constructor(
    public projectData: Project,
    public dispIl: string,

    public tempId: string = 'single-project',
    public dispId: string = dispIl,
    public addAt: boolean = true,
    public editId: string = projectData.id,
  ) {
    this.project = this.projectData;

    this.baseElements = document.querySelector(`#${tempId}`);
    this.outputElements = document.querySelector(`#${dispId}`);

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild;
    this.editElements.id = editId;
    this.editElements.draggable = true;

    this.configure();
    this.renderContent();
    this.attach(addAt);
}

  private get mandayChk() {
    if (this.project.manday > 20) {
      return this.project.manday / 20 + '人月';
    }
    return this.project.manday + '人日';
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    // console.log('drag Start', event);
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_event: DragEvent): void {
    // console.log('drag End');
  }

  private configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  private renderContent() {
    const titleH2 = document.createElement('h2');
    const descH3 = document.createElement('h3');
    const mandayP = document.createElement('p');
    titleH2.textContent = this.project.title;
    descH3.textContent = this.project.description;
    mandayP.textContent = this.mandayChk;

    this.editElements.appendChild(titleH2);
    this.editElements.appendChild(descH3);
    this.editElements.appendChild(mandayP);
  }

  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin': 'beforeend', this.editElements);
  }
}




const prjState = new ProjectState();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
