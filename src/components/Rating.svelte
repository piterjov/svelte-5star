<script>
  export let rating = 0;
  let decimalPart = 0;
  let roundedRating = Math.floor(rating);

  $: {
    console.log(`the rating is ${rating}`);
    decimalPart = (rating - roundedRating) * 100;
    console.log(decimalPart, roundedRating)
  }
  function generateStarClass(starNumber) {
    return `c-star ${rating === starNumber || rating > (starNumber-1) ? 'active' : ''}`
  }
</script>
<div>
  <svg style="width: 16; height: 15;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15">
    <defs>
      <mask id="half">
        <rect x="0" y="0" width="16" height="15" fill="white" />
        <rect x="{decimalPart}%" y="0" width="16" height="15" fill="black" />
      </mask>
      <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" id="star">
        <path d="M14.9613 5.20694L10.4983 4.55831L8.50314 0.513581C8.44864 0.402839 8.35899 0.31319 8.24825 0.258698C7.97052 0.121589 7.63302 0.235846 7.49415 0.513581L5.49903 4.55831L1.03595 5.20694C0.912902 5.22452 0.800402 5.28253 0.714269 5.37042C0.61014 5.47744 0.552759 5.62143 0.554737 5.77074C0.556715 5.92006 0.617888 6.06247 0.724816 6.16671L3.95392 9.31495L3.19103 13.7605C3.17314 13.8639 3.18458 13.9702 3.22406 14.0675C3.26354 14.1647 3.32947 14.2489 3.41439 14.3106C3.4993 14.3723 3.5998 14.4089 3.70448 14.4164C3.80917 14.4239 3.91385 14.4018 4.00665 14.3528L7.99864 12.254L11.9906 14.3528C12.0996 14.4108 12.2262 14.4302 12.3475 14.4091C12.6533 14.3564 12.859 14.0663 12.8063 13.7605L12.0434 9.31495L15.2725 6.16671C15.3604 6.08057 15.4184 5.96807 15.4359 5.84503C15.4834 5.53741 15.269 5.25264 14.9613 5.20694Z" />
      </symbol>
    </defs>
  </svg>
</div>
<div>
  {#each Array(5) as _, index}
    <svg  class={generateStarClass(index+1)} width="16" height="15" viewBox="0 0 16 15">
    <use xlink:href="#star" mask={ rating < (index+1) && rating > index ? 'url(#half)' : ''}>
    </use>
    <use xlink:href="#star" fill="none" stroke="#0097A7" stroke-width="1"></use>
  </svg>
  {/each}
</div>

<style>
  .star-rating {
   display: flex;
   justify-content: center;
   gap: 4px;
 }
 .c-star {
   width: var(--size, 50px);
   height: var(--size, 50px);
   fill: #FFF;
 }
 .c-star.active {
   fill: #F2C94C;
 }
 </style>