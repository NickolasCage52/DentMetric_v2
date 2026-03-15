import { ref, computed } from 'vue';
import type {
  DetailSession,
  DetailDent,
  DentDimensions,
  DetailStep,
  ClientData,
} from '../types/detailSession';
import { DENT_COLORS } from '../types/detailSession';

const session = ref<DetailSession>({
  currentStep: 'client',
  currentDentIndex: 0,
  client: null,
  photoDataUrl: null,
  photoAssetKey: null,
  markingMode: 'idle',
  dents: [],
  selectedDentId: null,
  orderDiscount: 0,
  finalResult: null,
});

export function useDetailSession() {
  function goToStep(step: DetailStep) {
    session.value.currentStep = step;
  }

  function setClient(client: ClientData | Record<string, unknown> | null) {
    session.value.client = client as ClientData | null;
  }

  function setPhoto(dataUrl: string, assetKey?: string) {
    session.value.photoDataUrl = dataUrl;
    session.value.photoAssetKey = assetKey ?? null;
  }

  function addDent(outlinePoints: number[]): DetailDent {
    const index = session.value.dents.length + 1;
    const color = DENT_COLORS[(index - 1) % DENT_COLORS.length];
    const dent: DetailDent = {
      id: `dent_${Date.now()}_${index}`,
      index,
      color,
      outline: { points: outlinePoints, color, type: 'regular' },
      dimensions: null,
      shapeType: null,
      complexity: null,
      conditions: {},
      coefficients: {},
      extraWork: {},
      totals: null,
      secondaryDeformation: null,
    };
    session.value.dents.push(dent);
    session.value.selectedDentId = dent.id;
    return dent;
  }

  function addSecondaryDeformation(parentDentId: string, outlinePoints: number[]) {
    const dent = session.value.dents.find((d) => d.id === parentDentId);
    if (!dent) return;
    dent.secondaryDeformation = {
      id: `sd_${Date.now()}`,
      parentDentId,
      outline: { points: outlinePoints, type: 'secondary' },
      dimensions: null,
      areaMm2: null,
      pricingResult: null,
    };
  }

  function setDentDimensions(dentId: string, dims: DentDimensions) {
    const dent = session.value.dents.find((d) => d.id === dentId);
    if (dent) dent.dimensions = dims;
  }

  function setDentOutline(dentId: string, points: number[]) {
    const dent = session.value.dents.find((d) => d.id === dentId);
    if (dent?.outline) dent.outline.points = points;
  }

  function setSecondaryDimensions(dentId: string, dims: DentDimensions) {
    const dent = session.value.dents.find((d) => d.id === dentId);
    if (dent?.secondaryDeformation) {
      dent.secondaryDeformation.dimensions = dims;
      dent.secondaryDeformation.areaMm2 = dims.lengthMm * dims.widthMm;
      dent.secondaryDeformation.pricingResult = null;
    }
  }

  function setSelectedDentId(dentId: string | null) {
    session.value.selectedDentId = dentId;
  }

  function deleteDent(dentId: string) {
    session.value.dents = session.value.dents
      .filter((d) => d.id !== dentId)
      .map((d, i) => ({
        ...d,
        index: i + 1,
        color: DENT_COLORS[i % DENT_COLORS.length],
      }));
    if (session.value.selectedDentId === dentId) {
      session.value.selectedDentId = session.value.dents[0]?.id ?? null;
    }
    session.value.currentDentIndex = Math.max(
      0,
      Math.min(session.value.currentDentIndex, session.value.dents.length - 1)
    );
  }

  function applyParametersToAll(sourceDentId: string) {
    const source = session.value.dents.find((d) => d.id === sourceDentId);
    if (!source) return;
    session.value.dents.forEach((dent) => {
      if (dent.id === sourceDentId) return;
      dent.shapeType = source.shapeType;
      dent.complexity = source.complexity;
      dent.conditions = { ...source.conditions };
      dent.coefficients = { ...source.coefficients };
      dent.extraWork = { ...source.extraWork };
    });
  }

  const allDimensionsFilled = computed(() => {
    if (session.value.dents.length === 0) return false;
    return session.value.dents.every((d) => {
      const dentOk =
        d.dimensions !== null &&
        d.dimensions.lengthMm > 0 &&
        d.dimensions.widthMm > 0;
      const sdOk =
        d.secondaryDeformation === null ||
        (d.secondaryDeformation.dimensions !== null &&
          d.secondaryDeformation.dimensions.lengthMm > 0 &&
          d.secondaryDeformation.dimensions.widthMm > 0);
      return dentOk && sdOk;
    });
  });

  const currentDent = computed(
    () => session.value.dents[session.value.currentDentIndex] ?? null
  );

  function resetSession() {
    session.value = {
      currentStep: 'client',
      currentDentIndex: 0,
      client: null,
      photoDataUrl: null,
      photoAssetKey: null,
      markingMode: 'idle',
      dents: [],
      selectedDentId: null,
      orderDiscount: 0,
      finalResult: null,
    };
  }

  return {
    session,
    goToStep,
    setClient,
    setPhoto,
    setSelectedDentId,
    addDent,
    addSecondaryDeformation,
    setDentDimensions,
    setSecondaryDimensions,
    setDentOutline,
    deleteDent,
    applyParametersToAll,
    allDimensionsFilled,
    currentDent,
    resetSession,
  };
}
