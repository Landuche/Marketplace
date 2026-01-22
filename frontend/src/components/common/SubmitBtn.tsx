interface SubmitBtnInterface {
  loading: boolean;
  text: string;
  loadingText?: string;
}

const SubmitBtn = ({ loading, text, loadingText = 'Loading...' }: SubmitBtnInterface) => (
  <button
    type='submit'
    disabled={loading}
    className={`w-full font-semibold py-3 rounded-xl transition-all shadow-lg text-white
        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
  >
    {' '}
    {loading ? loadingText : text}
  </button>
);

export default SubmitBtn;
